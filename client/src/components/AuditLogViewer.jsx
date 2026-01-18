import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Typography,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Collapse,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import auditLogService from '../services/auditLogService';

const ENTITY_TYPES = [
  'TASK',
  'PROJECT',
  'WORKSPACE',
  'USER',
  'COMMENT',
  'LABEL',
  'SPRINT',
];

const ACTION_TYPES = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'RESTORE',
  'ARCHIVE',
  'ASSIGN',
  'UNASSIGN',
];

const ACTION_COLORS = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  RESTORE: 'warning',
  ARCHIVE: 'default',
  ASSIGN: 'primary',
  UNASSIGN: 'secondary',
};

const AuditLogViewer = ({ workspaceId, entityType, entityId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    entityType: entityType || '',
    action: '',
    userId: '',
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    loadLogs();
  }, [workspaceId, entityId, page, rowsPerPage]);

  const loadLogs = async () => {
    try {
      setLoading(true);

      let data;
      if (entityType && entityId) {
        // Get history for specific entity
        data = await auditLogService.getEntityHistory(entityType, entityId);
        setLogs(Array.isArray(data) ? data : data.logs || []);
        setTotal(Array.isArray(data) ? data.length : data.total || 0);
      } else {
        // Query all logs with filters
        const params = {
          workspaceId,
          page: page + 1,
          limit: rowsPerPage,
          ...filters,
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
        };
        data = await auditLogService.query(params);
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(0);
    loadLogs();
  };

  const handleResetFilters = () => {
    setFilters({
      entityType: '',
      action: '',
      userId: '',
      startDate: null,
      endDate: null,
    });
    setPage(0);
  };

  const formatChanges = (log) => {
    if (!log.changedFields || log.changedFields.length === 0) {
      return 'No changes recorded';
    }

    return log.changedFields.map((field) => {
      const oldVal = log.oldValues?.[field] ?? '-';
      const newVal = log.newValues?.[field] ?? '-';
      return `${field}: "${oldVal}" → "${newVal}"`;
    }).join('\n');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Audit Logs</Typography>
        {!entityId && (
          <Button
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Collapse in={showFilters}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={filters.entityType}
                    label="Entity Type"
                    onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    {ENTITY_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={filters.action}
                    label="Action"
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  >
                    <MenuItem value="">All</MenuItem>
                    {ACTION_TYPES.map((action) => (
                      <MenuItem key={action} value={action}>
                        {action}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => setFilters({ ...filters, startDate: date })}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => setFilters({ ...filters, endDate: date })}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1}>
                  <Button variant="contained" size="small" onClick={handleApplyFilters}>
                    Apply Filters
                  </Button>
                  <Button variant="outlined" size="small" onClick={handleResetFilters}>
                    Reset
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>

      {/* Logs Table */}
      <Card>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Changes</TableCell>
                <TableCell align="right">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant="caption">
                      {formatDate(log.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={log.action}
                      color={ACTION_COLORS[log.action] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.entityType}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {log.entityId?.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.user?.name || log.userId?.substring(0, 8) || 'System'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ whiteSpace: 'pre-line' }}>
                      {log.changedFields?.length > 0
                        ? `${log.changedFields.length} field(s) changed`
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => setSelectedLog(log)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Timestamp
                </Typography>
                <Typography>{formatDate(selectedLog.timestamp)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Action
                </Typography>
                <Chip
                  label={selectedLog.action}
                  color={ACTION_COLORS[selectedLog.action] || 'default'}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Entity Type
                </Typography>
                <Typography>{selectedLog.entityType}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Entity ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {selectedLog.entityId}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  User
                </Typography>
                <Typography>
                  {selectedLog.user?.name || selectedLog.userId || 'System'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  IP Address
                </Typography>
                <Typography>{selectedLog.ipAddress || '-'}</Typography>
              </Grid>
              {selectedLog.changedFields?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Changes
                  </Typography>
                  <Card variant="outlined">
                    <CardContent>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Field</TableCell>
                            <TableCell>Old Value</TableCell>
                            <TableCell>New Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedLog.changedFields.map((field) => (
                            <TableRow key={field}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {field}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    backgroundColor: 'error.light',
                                    px: 1,
                                    borderRadius: 1,
                                  }}
                                >
                                  {JSON.stringify(selectedLog.oldValues?.[field]) || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    backgroundColor: 'success.light',
                                    px: 1,
                                    borderRadius: 1,
                                  }}
                                >
                                  {JSON.stringify(selectedLog.newValues?.[field]) || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedLog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuditLogViewer;
