import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Chip,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import recurringTaskService from '../services/recurringTaskService';

const PATTERNS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const RecurringTaskManager = ({ projectId }) => {
  const [recurringTasks, setRecurringTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pattern: 'WEEKLY',
    interval: 1,
    dayOfWeek: 1,
    dayOfMonth: 1,
    startDate: new Date(),
    endDate: null,
    priority: 'MEDIUM',
    assigneeId: '',
  });

  useEffect(() => {
    if (projectId) {
      loadRecurringTasks();
    }
  }, [projectId]);

  const loadRecurringTasks = async () => {
    try {
      setLoading(true);
      const data = await recurringTaskService.getByProject(projectId);
      setRecurringTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load recurring tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        pattern: task.pattern,
        interval: task.interval,
        dayOfWeek: task.dayOfWeek || 1,
        dayOfMonth: task.dayOfMonth || 1,
        startDate: new Date(task.startDate),
        endDate: task.endDate ? new Date(task.endDate) : null,
        priority: task.priority,
        assigneeId: task.assigneeId || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        pattern: 'WEEKLY',
        interval: 1,
        dayOfWeek: 1,
        dayOfMonth: 1,
        startDate: new Date(),
        endDate: null,
        priority: 'MEDIUM',
        assigneeId: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        projectId,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate?.toISOString() || null,
      };

      if (editingTask) {
        await recurringTaskService.update(editingTask.id, data);
      } else {
        await recurringTaskService.create(data);
      }

      handleCloseDialog();
      loadRecurringTasks();
    } catch (err) {
      setError('Failed to save recurring task');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring task?')) {
      try {
        await recurringTaskService.delete(id);
        loadRecurringTasks();
      } catch (err) {
        setError('Failed to delete recurring task');
      }
    }
  };

  const handleTogglePause = async (task) => {
    try {
      if (task.status === 'ACTIVE') {
        await recurringTaskService.pause(task.id);
      } else {
        await recurringTaskService.resume(task.id);
      }
      loadRecurringTasks();
    } catch (err) {
      setError('Failed to update recurring task status');
    }
  };

  const handleGenerateNow = async (id) => {
    try {
      await recurringTaskService.generateNow(id);
      alert('Task generated successfully!');
    } catch (err) {
      setError('Failed to generate task');
    }
  };

  const getPatternDescription = (task) => {
    switch (task.pattern) {
      case 'DAILY':
        return `Every ${task.interval > 1 ? task.interval + ' days' : 'day'}`;
      case 'WEEKLY':
        const day = DAYS_OF_WEEK.find(d => d.value === task.dayOfWeek)?.label || '';
        return `Every ${task.interval > 1 ? task.interval + ' weeks' : 'week'} on ${day}`;
      case 'MONTHLY':
        return `Every ${task.interval > 1 ? task.interval + ' months' : 'month'} on day ${task.dayOfMonth}`;
      case 'YEARLY':
        return `Every ${task.interval > 1 ? task.interval + ' years' : 'year'}`;
      default:
        return task.pattern;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Recurring Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Recurring Task
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Pattern</TableCell>
                <TableCell>Next Run</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recurringTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {task.title}
                    </Typography>
                    {task.description && (
                      <Typography variant="caption" color="text.secondary">
                        {task.description.substring(0, 50)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{getPatternDescription(task)}</TableCell>
                  <TableCell>
                    {task.nextRunAt
                      ? new Date(task.nextRunAt).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={task.status}
                      color={task.status === 'ACTIVE' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleTogglePause(task)}
                      title={task.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                    >
                      {task.status === 'ACTIVE' ? <PauseIcon /> : <PlayIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleGenerateNow(task.id)}
                      title="Generate Now"
                    >
                      <RefreshIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(task)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(task.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {recurringTasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No recurring tasks found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTask ? 'Edit Recurring Task' : 'Create Recurring Task'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Pattern</InputLabel>
                <Select
                  value={formData.pattern}
                  label="Pattern"
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                >
                  {PATTERNS.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Interval"
                value={formData.interval}
                onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1 }}
              />
            </Grid>
            {formData.pattern === 'WEEKLY' && (
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Day of Week</InputLabel>
                  <Select
                    value={formData.dayOfWeek}
                    label="Day of Week"
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <MenuItem key={d.value} value={d.value}>
                        {d.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {formData.pattern === 'MONTHLY' && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Day of Month"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || 1 })}
                  inputProps={{ min: 1, max: 31 }}
                />
              </Grid>
            )}
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Start Date"
                value={formData.startDate}
                onChange={(date) => setFormData({ ...formData, startDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="End Date (Optional)"
                value={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!formData.title}>
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecurringTaskManager;
