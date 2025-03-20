import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Link,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { bulkImportRequirements } from '../../services/requirementService';
import { RequirementForm } from '../../types';

// Steps for the import process
const steps = ['Upload File', 'Map Columns', 'Review & Import'];

const BulkImport: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importStats, setImportStats] = useState<{
    total: number;
    imported: number;
    errors: number;
  }>({ total: 0, imported: 0, errors: 0 });

  // Required fields in the system
  const requiredFields = ['title', 'description', 'module', 'submodule', 'function', 'priority', 'status', 'fitgap'];
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      
      // Read the file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (e.target?.result) {
            // Parse CSV
            const content = e.target.result as string;
            const rows = content.split('\n');
            
            // Get headers (first row)
            const headerRow = rows[0].split(',').map(h => h.trim());
            setHeaders(headerRow);
            
            // Initialize column mapping with best guesses
            const initialMapping: Record<string, string> = {};
            headerRow.forEach(header => {
              const lowerHeader = header.toLowerCase();
              
              // Try to match headers to required fields
              if (lowerHeader.includes('title')) initialMapping[header] = 'title';
              else if (lowerHeader.includes('desc')) initialMapping[header] = 'description';
              else if (lowerHeader.includes('module') && !lowerHeader.includes('sub')) initialMapping[header] = 'module';
              else if (lowerHeader.includes('submodule') || lowerHeader.includes('sub-module') || lowerHeader.includes('sub module')) initialMapping[header] = 'submodule';
              else if (lowerHeader.includes('function')) initialMapping[header] = 'function';
              else if (lowerHeader.includes('priority')) initialMapping[header] = 'priority';
              else if (lowerHeader.includes('status')) initialMapping[header] = 'status';
              else if (lowerHeader.includes('fit') || lowerHeader.includes('gap')) initialMapping[header] = 'fitgap';
              else if (lowerHeader.includes('phase')) initialMapping[header] = 'phase';
              else if (lowerHeader.includes('solution') && lowerHeader.includes('option')) initialMapping[header] = 'solution_option';
              else if (lowerHeader.includes('solution') && lowerHeader.includes('desc')) initialMapping[header] = 'solution_description';
              else if (lowerHeader.includes('note')) initialMapping[header] = 'additional_notes';
              else initialMapping[header] = '';
            });
            
            setColumnMapping(initialMapping);
            
            // Parse data rows
            const dataRows = rows.slice(1).filter(row => row.trim().length > 0).map(row => {
              const values = row.split(',').map(v => v.trim());
              const rowData: Record<string, string> = {};
              
              headerRow.forEach((header, index) => {
                rowData[header] = values[index] || '';
              });
              
              return rowData;
            });
            
            setFileData(dataRows);
          }
        } catch (err) {
          console.error('Error parsing file:', err);
          setError('Failed to parse file. Please make sure it is a valid CSV file.');
        }
      };
      
      reader.readAsText(file);
    }
  };
  
  // Trigger file input click
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle column mapping change
  const handleMappingChange = (header: string, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [header]: value,
    }));
  };
  
  // Validate the data before import
  const validateData = () => {
    const errors: Record<number, string[]> = {};
    let hasErrors = false;
    
    fileData.forEach((row, rowIndex) => {
      const rowErrors: string[] = [];
      
      // Check required fields
      requiredFields.forEach(field => {
        const mappedHeader = Object.keys(columnMapping).find(key => columnMapping[key] === field);
        if (!mappedHeader || !row[mappedHeader]) {
          rowErrors.push(`Missing required field: ${field}`);
        }
      });
      
      if (rowErrors.length > 0) {
        errors[rowIndex] = rowErrors;
        hasErrors = true;
      }
    });
    
    setValidationErrors(errors);
    return !hasErrors;
  };
  
  // Handle step navigation
  const handleNext = () => {
    if (activeStep === 0 && !selectedFile) {
      setError('Please select a file first');
      return;
    }
    
    if (activeStep === 1) {
      // Check if all required fields are mapped
      const isMissingRequiredField = requiredFields.some(field => 
        !Object.values(columnMapping).includes(field)
      );
      
      if (isMissingRequiredField) {
        setError('All required fields must be mapped');
        return;
      }
      
      // Validate data
      if (!validateData()) {
        setError('There are validation errors in the data. Please review.');
      }
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setError(null);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };
  
  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setFileData([]);
    setHeaders([]);
    setColumnMapping({});
    setValidationErrors({});
    setError(null);
    setSuccess(null);
  };
  
  // Handle import submission
  const handleImport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Transform data based on mappings
      const transformedData = fileData.map(row => {
        const transformedRow: Record<string, any> = {
          // Set default values for required fields in RequirementFormType
          title: '',
          description: '',
          details: '',
          function_id: 0,
          priority_id: 0,
          status_id: 0,
          fitgap_id: 0,
          phase: 'Initial',
          in_scope: true,
          option_id: null,
          comments: '',
        };
        
        // Apply mappings
        Object.keys(columnMapping).forEach(header => {
          const field = columnMapping[header];
          const value = row[header];
          
          if (field && value) {
            // Handle special mappings
            if (field === 'module' || field === 'submodule' || field === 'function') {
              // These will be resolved on the server side by name
              transformedRow[field] = value;
            } 
            else if (field === 'solution_option') {
              transformedRow.option_id = value;
            }
            else if (field === 'solution_description') {
              transformedRow.comments = value;
            }
            else {
              transformedRow[field] = value;
            }
          }
        });
        
        return transformedRow as RequirementForm;
      });
      
      // Send to API
      const result = await bulkImportRequirements(transformedData);
      
      // Calculate stats from the result
      const total = transformedData.length;
      const imported = result.importedRequirements.length;
      const errors = result.errors ? result.errors.length : 0;
      
      setImportStats({
        total,
        imported,
        errors,
      });
      
      setSuccess(`Successfully imported ${imported} of ${total} requirements`);
      
      if (errors > 0) {
        setError(`Failed to import ${errors} requirements due to errors`);
      } else {
        // Only navigate on full success, with a longer delay
        setTimeout(() => {
          navigate('/requirements');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error importing requirements:', err);
      setError(err.response?.data?.message || 'Failed to import requirements');
    } finally {
      setLoading(false);
    }
  };
  
  // Download template
  const downloadTemplate = () => {
    const headers = 'Title,Description,Module,SubModule,Function,Priority,Status,FitGap,Phase,Solution Option,Solution Description,Additional Notes';
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'requirements_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Render step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Upload a CSV file containing requirements
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                The file should be in CSV format with headers in the first row.
                Required fields include: Title, Description, Module, SubModule, Function, Priority, Status, and Fit/Gap.
              </Typography>
              
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                sx={{ mt: 2 }}
              >
                Download Template
              </Button>
            </Box>
            
            {selectedFile ? (
              <Box 
                sx={{ 
                  border: '1px dashed', 
                  borderColor: 'primary.main', 
                  p: 3, 
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FileIcon color="primary" sx={{ mr: 2 }} />
                  <Typography>
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </Typography>
                </Box>
                <IconButton color="error" onClick={handleReset}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={handleFileButtonClick}
                size="large"
              >
                Select File
              </Button>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Map File Columns to System Fields
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Match each column from your file to the corresponding field in the system.
              Required fields are marked with an asterisk (*).
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {headers.map((header) => (
                <Grid item xs={12} sm={6} md={4} key={header}>
                  <TextField
                    select
                    fullWidth
                    label={`Map "${header}"`}
                    value={columnMapping[header] || ''}
                    onChange={(e) => handleMappingChange(header, e.target.value)}
                  >
                    <MenuItem value="">Do not import</MenuItem>
                    {requiredFields.map((field) => (
                      <MenuItem 
                        key={field} 
                        value={field}
                        disabled={Object.values(columnMapping).includes(field) && columnMapping[header] !== field}
                      >
                        {field} *
                      </MenuItem>
                    ))}
                    <MenuItem value="phase">phase</MenuItem>
                    <MenuItem value="solution_option">solution_option</MenuItem>
                    <MenuItem value="solution_description">solution_description</MenuItem>
                    <MenuItem value="additional_notes">additional_notes</MenuItem>
                  </TextField>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle2" color="error">
                * Required fields
              </Typography>
            </Box>
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Review Data & Import
            </Typography>
            
            {Object.keys(validationErrors).length > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2">
                  Warning: {Object.keys(validationErrors).length} of {fileData.length} rows have validation errors
                </Typography>
                <Typography variant="body2">
                  These rows may not be imported correctly. Please consider fixing the issues before importing.
                </Typography>
              </Alert>
            )}
            
            <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    {requiredFields.map((field) => (
                      <TableCell key={field}>{field} *</TableCell>
                    ))}
                    <TableCell>phase</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fileData.slice(0, 50).map((row, rowIndex) => {
                    const hasError = validationErrors[rowIndex] && validationErrors[rowIndex].length > 0;
                    
                    return (
                      <TableRow 
                        key={rowIndex}
                        sx={{ backgroundColor: hasError ? 'error.lightest' : undefined }}
                      >
                        <TableCell>
                          {rowIndex + 1}
                          {hasError && (
                            <Tooltip title={validationErrors[rowIndex].join(', ')}>
                              <WarningIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                            </Tooltip>
                          )}
                        </TableCell>
                        
                        {requiredFields.map((field) => {
                          const mappedHeader = Object.keys(columnMapping).find(
                            (key) => columnMapping[key] === field
                          );
                          const value = mappedHeader ? row[mappedHeader] : '';
                          const isMissing = !value;
                          
                          return (
                            <TableCell 
                              key={field}
                              sx={{ color: isMissing ? 'error.main' : undefined }}
                            >
                              {value || 'Missing'}
                            </TableCell>
                          );
                        })}
                        
                        <TableCell>
                          {(() => {
                            const mappedHeader = Object.keys(columnMapping).find(
                              (key) => columnMapping[key] === 'phase'
                            );
                            return mappedHeader ? row[mappedHeader] : 'Initial';
                          })()}
                        </TableCell>
                        
                        <TableCell>
                          {hasError ? (
                            <Chip 
                              size="small" 
                              label="Error" 
                              color="error" 
                            />
                          ) : (
                            <Chip 
                              size="small"
                              label="Ready" 
                              color="success" 
                              icon={<CheckIcon />} 
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {fileData.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={requiredFields.length + 3} align="center">
                        <Typography variant="body2" color="text.secondary">
                          {fileData.length - 50} more rows not shown
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mr: 2 }}>
                Total rows: {fileData.length}
              </Typography>
              <Typography variant="subtitle1" sx={{ mr: 2, color: 'success.main' }}>
                Valid rows: {fileData.length - Object.keys(validationErrors).length}
              </Typography>
              {Object.keys(validationErrors).length > 0 && (
                <Typography variant="subtitle1" sx={{ color: 'error.main' }}>
                  Rows with errors: {Object.keys(validationErrors).length}
                </Typography>
              )}
            </Box>
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {importStats.total > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2">
                  Import Results:
                </Typography>
                <Typography variant="body2">
                  Total: {importStats.total}, Successfully imported: {importStats.imported}, Errors: {importStats.errors}
                </Typography>
                
                {importStats.imported > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Link 
                      component="button" 
                      variant="body2"
                      onClick={() => navigate('/requirements')}
                    >
                      View imported requirements
                    </Link>
                  </Box>
                )}
              </Alert>
            )}
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Bulk Import Requirements
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => {
            return (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        
        <Box sx={{ mt: 2, mb: 2 }}>
          {getStepContent(activeStep)}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            Back
          </Button>
          
          <Box>
            <Button 
              variant="outlined" 
              color="inherit" 
              onClick={() => navigate('/requirements')}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleImport}
                disabled={loading || importStats.total > 0}
              >
                {loading ? <CircularProgress size={24} /> : 'Import Requirements'}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleNext}
                disabled={loading}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default BulkImport;