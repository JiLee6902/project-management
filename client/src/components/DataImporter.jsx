import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import importService from '../services/importService';

const STEPS = ['Select File', 'Map Fields', 'Configure', 'Import'];

const DataImporter = ({ projectId, workspaceId, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [source, setSource] = useState('csv');
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const [config, setConfig] = useState({
    skipDuplicates: true,
    createLabels: true,
    assignToCurrentUser: false,
  });

  const targetFields = [
    { value: 'title', label: 'Title', required: true },
    { value: 'description', label: 'Description' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'labels', label: 'Labels' },
    { value: '', label: '-- Skip --' },
  ];

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError(null);

    try {
      const previewData = await importService.previewFile(selectedFile, source);
      setPreview(previewData);

      // Initialize mapping from suggestions
      const initialMapping = previewData.suggestedMapping || [];
      const fullMapping = previewData.headers.map((header) => {
        const suggested = initialMapping.find((m) => m.sourceField === header);
        return {
          sourceField: header,
          targetField: suggested?.targetField || '',
        };
      });
      setMapping(fullMapping);

      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to preview file');
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (index, targetField) => {
    const newMapping = [...mapping];
    newMapping[index].targetField = targetField;
    setMapping(newMapping);
  };

  const handleImport = async () => {
    setLoading(true);
    setError(null);

    try {
      const importConfig = {
        source,
        entity: 'tasks',
        projectId,
        ...config,
        columnMapping: mapping.filter((m) => m.targetField),
      };

      const importResult = await importService.importTasks(file, importConfig);
      setResult(importResult);
      setActiveStep(3);

      if (onComplete) {
        onComplete(importResult);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    importService.downloadTemplate('tasks');
  };

  const handleReset = () => {
    setActiveStep(0);
    setFile(null);
    setPreview(null);
    setMapping([]);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isMappingValid = () => {
    return mapping.some((m) => m.targetField === 'title');
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" gutterBottom>
              Upload your data file
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              Supported formats: CSV, JSON
            </Typography>

            <Box my={3}>
              <FormControl sx={{ minWidth: 200, mb: 2 }}>
                <InputLabel>File Type</InputLabel>
                <Select
                  value={source}
                  label="File Type"
                  onChange={(e) => setSource(e.target.value)}
                >
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept={source === 'csv' ? '.csv' : '.json'}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <Button
              variant="contained"
              size="large"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Choose File'}
            </Button>

            <Box mt={3}>
              <Button
                variant="text"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadTemplate}
              >
                Download Template
              </Button>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Map your columns
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              Match your file columns to task fields. "Title" is required.
            </Typography>

            <Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Your Column</TableCell>
                  <TableCell>Sample Data</TableCell>
                  <TableCell>Maps To</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mapping.map((item, index) => (
                  <TableRow key={item.sourceField}>
                    <TableCell>
                      <Typography fontWeight="medium">
                        {item.sourceField}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {preview?.sampleData?.[0]?.[item.sourceField]?.substring(0, 30) || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 150 }}>
                        <Select
                          value={item.targetField}
                          onChange={(e) => handleMappingChange(index, e.target.value)}
                        >
                          {targetFields.map((field) => (
                            <MenuItem key={field.value} value={field.value}>
                              {field.label}
                              {field.required && ' *'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box mt={3} display="flex" justifyContent="space-between">
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(2)}
                disabled={!isMappingValid()}
              >
                Next
              </Button>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Import Options
            </Typography>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={config.skipDuplicates}
                      onChange={(e) =>
                        setConfig({ ...config, skipDuplicates: e.target.checked })
                      }
                    />
                  }
                  label="Skip duplicate tasks (same title)"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={config.createLabels}
                      onChange={(e) =>
                        setConfig({ ...config, createLabels: e.target.checked })
                      }
                    />
                  }
                  label="Create labels if they don't exist"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={config.assignToCurrentUser}
                      onChange={(e) =>
                        setConfig({ ...config, assignToCurrentUser: e.target.checked })
                      }
                    />
                  }
                  label="Assign all tasks to me"
                />
              </Grid>
            </Grid>

            <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Import Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                File: {file?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total rows: {preview?.totalRows}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fields mapped: {mapping.filter((m) => m.targetField).length}
              </Typography>
            </Paper>

            <Box mt={3} display="flex" justifyContent="space-between">
              <Button onClick={() => setActiveStep(1)}>Back</Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Start Import'}
              </Button>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box textAlign="center" py={4}>
            {result?.success ? (
              <SuccessIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            )}

            <Typography variant="h6" gutterBottom>
              Import {result?.success ? 'Complete' : 'Completed with Errors'}
            </Typography>

            <Grid container spacing={2} sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}>
              <Grid item xs={6}>
                <Chip
                  label={`${result?.importedCount || 0} Imported`}
                  color="success"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={6}>
                <Chip
                  label={`${result?.skippedCount || 0} Skipped`}
                  color="warning"
                  variant="outlined"
                />
              </Grid>
              {result?.summary?.labelsCreated > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    {result.summary.labelsCreated} labels created
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Duration: {result?.summary?.duration}ms
                </Typography>
              </Grid>
            </Grid>

            {result?.errors?.length > 0 && (
              <Box mt={3} textAlign="left">
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Errors ({result.errors.length}):
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}
                >
                  {result.errors.slice(0, 10).map((err, index) => (
                    <Typography key={index} variant="caption" display="block">
                      Row {err.row}: {err.message}
                    </Typography>
                  ))}
                  {result.errors.length > 10 && (
                    <Typography variant="caption" color="text.secondary">
                      ... and {result.errors.length - 10} more errors
                    </Typography>
                  )}
                </Paper>
              </Box>
            )}

            <Box mt={4}>
              <Button variant="contained" onClick={handleReset}>
                Import More Data
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && activeStep !== 3 && <LinearProgress sx={{ mb: 2 }} />}

        {renderStepContent()}
      </CardContent>
    </Card>
  );
};

export default DataImporter;
