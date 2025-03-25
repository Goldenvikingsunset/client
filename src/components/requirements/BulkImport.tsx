import React, { useState, useRef, useEffect } from 'react';
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
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Switch,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  TableChart as ExcelIcon,
  FormatAlignJustify as CsvIcon,
  InfoOutlined as InfoIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { bulkImportRequirements } from '../../services/requirementService';
import { RequirementForm } from '../../types';
// Import the xlsx library for Excel file parsing
import * as XLSX from 'xlsx';
// Import services for master data
import { 
  modules, 
  subModules, 
  functions,
  priorities,
  statuses,
  fitGapStatuses,
  bcDepartments,
  bcrtm
} from '../../services/masterDataService';

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
  // Add state for template format
  const [templateFormat, setTemplateFormat] = useState<'csv' | 'excel'>('excel');
  // Master data for validation and dropdown options
  const [moduleList, setModuleList] = useState<any[]>([]);
  const [submoduleList, setSubmoduleList] = useState<any[]>([]);
  const [functionList, setFunctionList] = useState<any[]>([]);
  const [priorityList, setPriorityList] = useState<any[]>([]);
  const [statusList, setStatusList] = useState<any[]>([]);
  const [fitGapList, setFitGapList] = useState<any[]>([]);
  const [departmentList, setDepartmentList] = useState<any[]>([]);
  const [areaList, setAreaList] = useState<any[]>([]);
  const [masterDataLoading, setMasterDataLoading] = useState(true);
  // Add state for including master data in template
  const [includeMasterData, setIncludeMasterData] = useState(true);
  
  // New state for allowing partial mapping
  const [allowPartialMapping, setAllowPartialMapping] = useState(false);
  const [skippedRequiredFields, setSkippedRequiredFields] = useState<string[]>([]);

  // Required fields in the system
  const requiredFields = ['title', 'description', 'module', 'submodule', 'function', 'priority', 'status', 'fitgap'];
  
  // Add BC RTM required fields
  const bcRequiredFields = ['business_central_functional_department', 'functional_area', 'functional_consultant', 'requirement_owner_client'];

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setMasterDataLoading(true);
        // Fetch master data in parallel
        const [
          modulesData, 
          submodulesData, 
          functionsData, 
          prioritiesData,
          statusesData,
          fitGapData,
          departmentsResponse,
          areasResponse
        ] = await Promise.all([
          modules.getAll(),
          subModules.getAll(),
          functions.getAll(),
          priorities.getAll(),
          statuses.getAll(),
          fitGapStatuses.getAll(),
          bcrtm.getDepartments(),
          bcrtm.getFunctionalAreas()
        ]);
        
        setModuleList(modulesData);
        setSubmoduleList(submodulesData);
        setFunctionList(functionsData);
        setPriorityList(prioritiesData);
        setStatusList(statusesData);
        setFitGapList(fitGapData);
        setDepartmentList(departmentsResponse.departments || []);
        setAreaList(areasResponse.areas || []);
      } catch (err) {
        console.error('Error fetching master data:', err);
        setError('Failed to load master data for validation. Some validations might not work correctly.');
      } finally {
        setMasterDataLoading(false);
      }
    };
    
    fetchMasterData();
  }, []);
  
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
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            
            if (fileExtension === 'xlsx' || fileExtension === 'xls') {
              // Parse Excel file
              parseExcelFile(e.target.result);
            } else {
              // Parse CSV file
              parseCsvFile(e.target.result as string);
            }
          }
        } catch (err) {
          console.error('Error parsing file:', err);
          setError(`Failed to parse ${file.name}. Please make sure it is a valid CSV or Excel file.`);
        }
      };
      
      // Read as array buffer for Excel or as text for CSV
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    }
  };
  
  // Parse Excel file
  const parseExcelFile = (fileContent: string | ArrayBuffer) => {
    try {
      // Parse the workbook
      const workbook = XLSX.read(fileContent, { type: 'array' });
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (data.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }
      
      // Extract headers (first row) and convert to strings
      const headerRow = data[0].map(h => String(h).trim());
      setHeaders(headerRow);
      
      // Initialize column mapping with best guesses
      initializeColumnMapping(headerRow);
      
      // Extract data rows (skip header)
      const dataRows = data.slice(1).filter(row => row.length > 0).map(row => {
        const rowData: Record<string, string> = {};
        headerRow.forEach((header, index) => {
          rowData[header] = row[index] !== undefined ? String(row[index]).trim() : '';
        });
        return rowData;
      });
      
      setFileData(dataRows);
    } catch (err) {
      console.error('Error parsing Excel file:', err);
      setError('Failed to parse Excel file. Please check the file format.');
      setFileData([]);
      setHeaders([]);
    }
  };
  
  // Parse CSV file
  const parseCsvFile = (content: string) => {
    try {
      const rows = content.split('\n');
      
      // Get headers (first row)
      const headerRow = rows[0].split(',').map(h => h.trim());
      setHeaders(headerRow);
      
      // Initialize column mapping with best guesses
      initializeColumnMapping(headerRow);
      
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
    } catch (err) {
      console.error('Error parsing CSV file:', err);
      setError('Failed to parse CSV file. Please check the file format.');
      setFileData([]);
      setHeaders([]);
    }
  };
  
  // Initialize column mapping with best guesses
  const initializeColumnMapping = (headerRow: string[]) => {
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
      else if (lowerHeader.includes('status') && !lowerHeader.includes('client')) initialMapping[header] = 'status';
      else if (lowerHeader.includes('fit') || lowerHeader.includes('gap')) initialMapping[header] = 'fitgap';
      else if (lowerHeader.includes('phase') && !lowerHeader.includes('comment')) initialMapping[header] = 'phase';
      // BC RTM specific field mappings
      else if (lowerHeader.includes('depart')) initialMapping[header] = 'business_central_functional_department';
      else if (lowerHeader.includes('area') || lowerHeader.includes('functional area')) initialMapping[header] = 'functional_area';
      else if (lowerHeader.includes('template')) initialMapping[header] = 'template_item';
      else if (lowerHeader.includes('consultant')) initialMapping[header] = 'functional_consultant';
      else if (lowerHeader.includes('client') && lowerHeader.includes('owner')) initialMapping[header] = 'requirement_owner_client';
      else if (lowerHeader.includes('solution') && lowerHeader.includes('1')) initialMapping[header] = 'solution_option_1';
      else if (lowerHeader.includes('time') && lowerHeader.includes('1')) initialMapping[header] = 'solution_option_1_time_estimate';
      else if (lowerHeader.includes('solution') && lowerHeader.includes('2')) initialMapping[header] = 'solution_option_2';
      else if (lowerHeader.includes('time') && lowerHeader.includes('2')) initialMapping[header] = 'solution_option_2_time_estimate';
      else if (lowerHeader.includes('solution') && lowerHeader.includes('3')) initialMapping[header] = 'solution_option_3';
      else if (lowerHeader.includes('time') && lowerHeader.includes('3')) initialMapping[header] = 'solution_option_3_time_estimate';
      else if (lowerHeader.includes('workshop')) initialMapping[header] = 'workshop_name';
      else if (lowerHeader.includes('phase') && lowerHeader.includes('comment')) initialMapping[header] = 'phase_comments';
      else if (lowerHeader.includes('client') && lowerHeader.includes('status')) initialMapping[header] = 'status_client';
      else if (lowerHeader.includes('client') && lowerHeader.includes('comment')) initialMapping[header] = 'client_comments';
      else if (lowerHeader.includes('client') && lowerHeader.includes('prefer')) initialMapping[header] = 'client_preferences';
      // Legacy fields
      else if (lowerHeader.includes('solution') && lowerHeader.includes('option')) initialMapping[header] = 'solution_option';
      else if (lowerHeader.includes('solution') && lowerHeader.includes('desc')) initialMapping[header] = 'solution_description';
      else if (lowerHeader.includes('note')) initialMapping[header] = 'additional_notes';
      else initialMapping[header] = '';
    });
    
    setColumnMapping(initialMapping);
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
  
  // Handle template format change
  const handleTemplateFormatChange = (
    event: React.MouseEvent<HTMLElement>,
    newFormat: 'csv' | 'excel' | null
  ) => {
    if (newFormat !== null) {
      setTemplateFormat(newFormat);
    }
  };
  
  // Validate the data before import
  const validateData = () => {
    const errors: Record<number, string[]> = {};
    let hasErrors = false;
    
    // Collect list of skipped required fields
    const missingRequiredFields = requiredFields.filter(field => 
      !Object.values(columnMapping).includes(field)
    );
    setSkippedRequiredFields(missingRequiredFields);
    
    // Track validation statistics
    let errorsByType: Record<string, number> = {};
    
    // Validate each row
    fileData.forEach((row, rowIndex) => {
      const rowErrors: string[] = [];
      
      if (!allowPartialMapping) {
        // Check required fields only if partial mapping is not allowed
        requiredFields.forEach(field => {
          const mappedHeader = Object.keys(columnMapping).find(key => columnMapping[key] === field);
          if (!mappedHeader || !row[mappedHeader]) {
            const errorMessage = `Missing required field: ${field}`;
            rowErrors.push(errorMessage);
            errorsByType[field] = (errorsByType[field] || 0) + 1;
          }
        });
      } else {
        // If partial mapping is allowed, only validate fields that are mapped
        requiredFields.forEach(field => {
          const mappedHeader = Object.keys(columnMapping).find(key => columnMapping[key] === field);
          if (mappedHeader && !row[mappedHeader]) {
            const errorMessage = `Missing value for mapped field: ${field}`;
            rowErrors.push(errorMessage);
            errorsByType[field] = (errorsByType[field] || 0) + 1;
          }
        });
      }
      
      // Check BC RTM required fields
      bcRequiredFields.forEach(field => {
        const mappedHeader = Object.keys(columnMapping).find(key => columnMapping[key] === field);
        if (mappedHeader && !row[mappedHeader]) {
          const errorMessage = `Missing BC RTM required field: ${field}`;
          rowErrors.push(errorMessage);
          errorsByType[field] = (errorsByType[field] || 0) + 1;
        }
      });
      
      // Additional validation for master data
      const moduleHeader = Object.keys(columnMapping).find(key => columnMapping[key] === 'module');
      if (moduleHeader && row[moduleHeader] && moduleList.length > 0) {
        const moduleExists = moduleList.some(m => 
          m.name.toLowerCase() === row[moduleHeader].toLowerCase()
        );
        if (!moduleExists) {
          const errorMessage = `Module "${row[moduleHeader]}" does not exist in the system`;
          rowErrors.push(errorMessage);
          errorsByType['invalid_module'] = (errorsByType['invalid_module'] || 0) + 1;
        }
      }
      
      const submoduleHeader = Object.keys(columnMapping).find(key => columnMapping[key] === 'submodule');
      if (submoduleHeader && row[submoduleHeader] && submoduleList.length > 0) {
        const submoduleExists = submoduleList.some(sm => 
          sm.name.toLowerCase() === row[submoduleHeader].toLowerCase()
        );
        if (!submoduleExists) {
          const errorMessage = `Submodule "${row[submoduleHeader]}" does not exist in the system`;
          rowErrors.push(errorMessage);
          errorsByType['invalid_submodule'] = (errorsByType['invalid_submodule'] || 0) + 1;
        }
      }
      
      const departmentHeader = Object.keys(columnMapping).find(key => columnMapping[key] === 'business_central_functional_department');
      if (departmentHeader && row[departmentHeader] && departmentList.length > 0) {
        const departmentExists = departmentList.some(d => 
          d.name.toLowerCase() === row[departmentHeader].toLowerCase()
        );
        if (!departmentExists) {
          const errorMessage = `Department "${row[departmentHeader]}" does not exist in the system`;
          rowErrors.push(errorMessage);
          errorsByType['invalid_department'] = (errorsByType['invalid_department'] || 0) + 1;
        }
      }
      
      const areaHeader = Object.keys(columnMapping).find(key => columnMapping[key] === 'functional_area');
      if (areaHeader && row[areaHeader] && areaList.length > 0) {
        const areaExists = areaList.some(a => 
          a.name.toLowerCase() === row[areaHeader].toLowerCase()
        );
        if (!areaExists) {
          const errorMessage = `Functional Area "${row[areaHeader]}" does not exist in the system`;
          rowErrors.push(errorMessage);
          errorsByType['invalid_area'] = (errorsByType['invalid_area'] || 0) + 1;
        }
      }
      
      if (rowErrors.length > 0) {
        errors[rowIndex] = rowErrors;
        hasErrors = true;
      }
    });
    
    setValidationErrors(errors);

    // Store validation statistics for summary display
    setValidationSummary(errorsByType);
    
    // If partial mapping is allowed, don't block on validation errors from missing required fields
    if (allowPartialMapping) {
      return true; // Always return true when partial mapping is enabled
    }
    
    return !hasErrors;
  };

  // Add state to store validation summary
  const [validationSummary, setValidationSummary] = useState<Record<string, number>>({});
  
  // Handle step navigation
  const handleNext = () => {
    if (activeStep === 0 && !selectedFile) {
      setError('Please select a file first');
      return;
    }
    
    if (activeStep === 1) {
      // Check if all required fields are mapped (only if partial mapping is not allowed)
      const isMissingRequiredField = !allowPartialMapping && requiredFields.some(field => 
        !Object.values(columnMapping).includes(field)
      );
      
      if (isMissingRequiredField) {
        setError('All required fields must be mapped or enable "Allow Partial Mapping"');
        return;
      }
      
      // Run validation but don't block on errors if partial mapping is allowed
      validateData();
    }
    
    // Always progress to the next step
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
    setSkippedRequiredFields([]);
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
          // Set default values for BC RTM fields
          business_central_functional_department: null,
          functional_area: null,
          bc_department_id: null,
          functional_area_id: null,
          template_item: false,
          functional_consultant: '',
          requirement_owner_client: '',
          solution_option_1: '',
          solution_option_1_time_estimate: null,
          solution_option_2: '',
          solution_option_2_time_estimate: null,
          solution_option_3: '',
          solution_option_3_time_estimate: null,
          workshop_name: '',
          phase_comments: '',
          status_client: '',
          client_comments: '',
          client_preferences: '',
          // New field to flag items with missing required fields
          needs_review: allowPartialMapping && skippedRequiredFields.length > 0
        };
        
        // Apply mappings
        Object.keys(columnMapping).forEach(header => {
          const field = columnMapping[header];
          const value = row[header];
          
          if (field && value !== undefined) {
            // Handle special mappings
            if (field === 'module' || field === 'submodule' || field === 'function') {
              // These will be resolved on the server side by name
              transformedRow[field] = value;
            }
            else if (field === 'business_central_functional_department') {
              // Store department name for server-side resolution
              transformedRow['department_name'] = value;
              // Department ID will be resolved on the server
              transformedRow['business_central_functional_department'] = value;
              transformedRow['bc_department_id'] = value;
            }
            else if (field === 'functional_area') {
              // Store area name for server-side resolution
              transformedRow['area_name'] = value;
              // Area ID will be resolved on the server
              transformedRow['functional_area'] = value;
              transformedRow['functional_area_id'] = value;
            }
            else if (field === 'template_item') {
              // Convert to boolean
              transformedRow[field] = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === '1';
            }
            else if (field === 'solution_option_1_time_estimate' || 
                    field === 'solution_option_2_time_estimate' || 
                    field === 'solution_option_3_time_estimate') {
              // Convert to number or null
              transformedRow[field] = value ? parseFloat(value) : null;
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
      
      if (allowPartialMapping && skippedRequiredFields.length > 0) {
        setSuccess(
          `Successfully imported ${imported} of ${total} requirements. 
          Note: ${skippedRequiredFields.length} required fields were not mapped 
          and will need to be updated manually.`
        );
      } else {
        setSuccess(`Successfully imported ${imported} of ${total} requirements`);
      }
      
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
    if (templateFormat === 'csv') {
      // Download CSV template
      const headers = 'Title,Description,Module,SubModule,Function,Priority,Status,FitGap,Phase,Department,FunctionalArea,TemplateItem,FunctionalConsultant,ClientOwner,SolutionOption1,TimeEstimate1,SolutionOption2,TimeEstimate2,SolutionOption3,TimeEstimate3,WorkshopName,PhaseComments,ClientStatus,ClientComments,ClientPreferences';
      const blob = new Blob([headers], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'requirements_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Download Excel template with dropdown options
      const ws = XLSX.utils.aoa_to_sheet([
        [
          'Title', 'Description', 'Module', 'SubModule', 'Function', 'Priority', 'Status', 'FitGap', 'Phase',
          'Department', 'FunctionalArea', 'TemplateItem', 'FunctionalConsultant', 'ClientOwner',
          'SolutionOption1', 'TimeEstimate1', 'SolutionOption2', 'TimeEstimate2', 'SolutionOption3', 'TimeEstimate3',
          'WorkshopName', 'PhaseComments', 'ClientStatus', 'ClientComments', 'ClientPreferences'
        ]
      ]);
      
      // Add dropdown validations where applicable if we have master data
      if (!masterDataLoading && includeMasterData) {
        // Example of adding data validation for Module column
        if (moduleList.length > 0) {
          const moduleOptions = moduleList.map(m => m.name);
          addValidationToWorksheet(ws, 'C', moduleOptions);
        }
        
        // Add dropdown for submodules
        if (submoduleList.length > 0) {
          const submoduleOptions = submoduleList.map(sm => sm.name);
          addValidationToWorksheet(ws, 'D', submoduleOptions);
        }
        
        // Add dropdown for functions
        if (functionList.length > 0) {
          const functionOptions = functionList.map(f => f.name);
          addValidationToWorksheet(ws, 'E', functionOptions);
        }
        
        // Add dropdown for priorities
        if (priorityList.length > 0) {
          const priorityOptions = priorityList.map(p => p.name);
          addValidationToWorksheet(ws, 'F', priorityOptions);
        }
        
        // Add dropdown for status
        if (statusList.length > 0) {
          const statusOptions = statusList.map(s => s.name);
          addValidationToWorksheet(ws, 'G', statusOptions);
        }
        
        // Add dropdown for fitgap
        if (fitGapList.length > 0) {
          const fitGapOptions = fitGapList.map(fg => fg.name);
          addValidationToWorksheet(ws, 'H', fitGapOptions);
        }
        
        // Add dropdown for phase
        addValidationToWorksheet(ws, 'I', ['Initial', 'Analysis', 'Design', 'Development', 'Testing', 'UAT', 'Go-Live']);
        
        // Add dropdown for departments
        if (departmentList.length > 0) {
          const departmentOptions = departmentList.map(d => d.name);
          addValidationToWorksheet(ws, 'J', departmentOptions);
        }
        
        // Add dropdown for functional areas
        if (areaList.length > 0) {
          const areaOptions = areaList.map(a => a.name);
          addValidationToWorksheet(ws, 'K', areaOptions);
        }
        
        // Add dropdown for template item
        addValidationToWorksheet(ws, 'L', ['Yes', 'No']);
      }
      
      // Create sample data row with realistic examples
      if (includeMasterData) {
        const sampleRow = [
          'AR Invoice Processing', 
          'System should allow users to process AR invoices in batches',
          moduleList.length > 0 ? moduleList[0].name : 'Financials', 
          submoduleList.length > 0 ? submoduleList[0].name : 'Accounts Receivable', 
          functionList.length > 0 ? functionList[0].name : 'Invoice Processing',
          priorityList.length > 0 ? priorityList[0].name : 'High',
          statusList.length > 0 ? statusList[0].name : 'New',
          fitGapList.length > 0 ? fitGapList[0].name : 'Fit',
          'Initial',
          departmentList.length > 0 ? departmentList[0].name : 'Finance',
          areaList.length > 0 ? areaList[0].name : 'General Ledger',
          'No',
          'John Smith',
          'Jane Doe',
          'Standard BC functionality',
          '0',
          'Custom development',
          '5',
          '',
          '',
          'Finance Workshop',
          'To be discussed in next workshop',
          'Approved',
          'Team prefers standard functionality',
          'Must support batch processing'
        ];
        
        // Add sample row
        XLSX.utils.sheet_add_aoa(ws, [sampleRow], { origin: 'A2' });
      }
      
      // Format cells
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Requirements');
      
      // Add worksheet with lookup data for reference
      if (!masterDataLoading && includeMasterData) {
        // Create master data reference sheet
        const refWS = XLSX.utils.aoa_to_sheet([['Master Data Reference']]);
        
        // Add modules
        XLSX.utils.sheet_add_aoa(refWS, [['Modules:']], { origin: 'A2' });
        const moduleData = moduleList.map((m) => [`${m.name}`]);
        XLSX.utils.sheet_add_aoa(refWS, moduleData, { origin: 'A3' });
        
        // Add submodules
        const startRow = 3 + moduleList.length + 1;
        XLSX.utils.sheet_add_aoa(refWS, [['Submodules:']], { origin: `A${startRow}` });
        const submoduleData = submoduleList.map((sm) => [`${sm.name}`]);
        XLSX.utils.sheet_add_aoa(refWS, submoduleData, { origin: `A${startRow + 1}` });
        
        // Add departments
        const deptRow = startRow + submoduleList.length + 2;
        XLSX.utils.sheet_add_aoa(refWS, [['Departments:']], { origin: `A${deptRow}` });
        const departmentData = departmentList.map((d) => [`${d.name}`]);
        XLSX.utils.sheet_add_aoa(refWS, departmentData, { origin: `A${deptRow + 1}` });
        
        // Add functional areas
        const areaRow = deptRow + departmentList.length + 2;
        XLSX.utils.sheet_add_aoa(refWS, [['Functional Areas:']], { origin: `A${areaRow}` });
        const areaData = areaList.map((a) => [`${a.name}`]);
        XLSX.utils.sheet_add_aoa(refWS, areaData, { origin: `A${areaRow + 1}` });
        
        // Add reference sheet to workbook
        XLSX.utils.book_append_sheet(wb, refWS, 'Reference Data');
      }
      
      XLSX.writeFile(wb, 'requirements_template.xlsx');
    }
  };
  
  // Helper function to add data validation to Excel worksheet
  const addValidationToWorksheet = (worksheet: XLSX.WorkSheet, column: string, options: string[]) => {
    if (!worksheet['!cols']) worksheet['!cols'] = [];
    
    // This is a hack since xlsx doesn't support data validation directly
    // In a real implementation, we would need to use a different approach
    // but for now we'll set the column width appropriately
    const colIdx = column.charCodeAt(0) - 'A'.charCodeAt(0);
    worksheet['!cols'][colIdx] = { width: Math.max(options.reduce((max, opt) => Math.max(max, opt.length), 10), 12) };
  };
  
  // Handle clear specific type of error
  const handleFixErrors = (errorType: string) => {
    // This is a helper function to guide users on how to fix common errors
    switch(errorType) {
      case 'module':
        setError(`Fix "module" errors by ensuring all rows have a valid module name. Valid modules: ${moduleList.map(m => m.name).join(', ')}`);
        break;
      case 'submodule':
        setError(`Fix "submodule" errors by ensuring all rows have a valid submodule name. Valid submodules depend on the chosen module.`);
        break;
      case 'function':
        setError(`Fix "function" errors by ensuring all rows have a valid function name. Valid functions depend on the chosen submodule.`);
        break;
      case 'priority':
        setError(`Fix "priority" errors by ensuring all rows have a valid priority. Valid priorities: ${priorityList.map(p => p.name).join(', ')}`);
        break;
      case 'status':
        setError(`Fix "status" errors by ensuring all rows have a valid status. Valid statuses: ${statusList.map(s => s.name).join(', ')}`);
        break;
      case 'fitgap':
        setError(`Fix "fitgap" errors by ensuring all rows have a valid Fit/Gap value. Valid values: ${fitGapList.map(fg => fg.name).join(', ')}`);
        break;
      case 'invalid_module':
      case 'invalid_submodule':
      case 'invalid_department':
      case 'invalid_area':
        setError(`Fix master data validation errors by checking that the value matches exactly what exists in the system. Case-sensitive comparison is used.`);
        break;
      default:
        setError(`Fix "${errorType}" errors by ensuring all required fields have values.`);
    }
  };

  // Render step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Upload a CSV or Excel file containing requirements
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                The file should have headers in the first row.
                Required fields include: Title, Description, Module, SubModule, Function, Priority, Status, and Fit/Gap.
              </Typography>
              
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Download a template:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <ToggleButtonGroup
                    value={templateFormat}
                    exclusive
                    onChange={handleTemplateFormatChange}
                    aria-label="template format"
                    size="small"
                  >
                    <ToggleButton value="excel" aria-label="excel">
                      <ExcelIcon sx={{ mr: 1 }} />
                      Excel
                    </ToggleButton>
                    <ToggleButton value="csv" aria-label="csv">
                      <CsvIcon sx={{ mr: 1 }} />
                      CSV
                    </ToggleButton>
                  </ToggleButtonGroup>
                  
                  {templateFormat === 'excel' && (
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={includeMasterData} 
                          onChange={(event) => setIncludeMasterData(event.target.checked)}
                          color="primary"
                        />
                      }
                      label="Include master data and sample row"
                    />
                  )}
                  
                  <Button 
                    variant="outlined" 
                    startIcon={<DownloadIcon />}
                    onClick={downloadTemplate}
                    disabled={templateFormat === 'excel' && masterDataLoading}
                  >
                    {masterDataLoading && templateFormat === 'excel' ? 
                      <CircularProgress size={20} /> : 'Download Template'}
                  </Button>
                  {masterDataLoading && templateFormat === 'excel' && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Loading master data for template...
                    </Typography>
                  )}
                </Box>
              </Box>
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
            
            {/* Add partial mapping option */}
            <Box sx={{ mt: 2, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'background.paper' }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={allowPartialMapping} 
                      onChange={(e) => setAllowPartialMapping(e.target.checked)}
                      color="primary"
                      id="partial-mapping-switch"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ mr: 1 }}>Allow Partial Mapping</Typography>
                      <Tooltip title="Enable this option to import requirements with incomplete data. You'll need to fill in missing information later manually.">
                        <InfoIcon fontSize="small" color="info" />
                      </Tooltip>
                    </Box>
                  }
                />
              </FormGroup>
              {allowPartialMapping && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Partial mapping is enabled. Requirements will be imported with default values for unmapped required fields.
                    You'll need to update these fields manually after import.
                  </Typography>
                </Alert>
              )}
            </Box>
            
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
                    <MenuItem disabled>--- Required Fields ---</MenuItem>
                    {requiredFields.map((field) => (
                      <MenuItem 
                        key={field} 
                        value={field}
                        disabled={Object.values(columnMapping).includes(field) && columnMapping[header] !== field}
                      >
                        {field} {!allowPartialMapping ? '*' : ''}
                      </MenuItem>
                    ))}
                    <MenuItem disabled>--- BC RTM Fields ---</MenuItem>
                    <MenuItem value="phase">phase</MenuItem>
                    <MenuItem value="business_central_functional_department">Department *</MenuItem>
                    <MenuItem value="functional_area">Functional Area *</MenuItem>
                    <MenuItem value="template_item">Template Item</MenuItem>
                    <MenuItem value="functional_consultant">Functional Consultant *</MenuItem>
                    <MenuItem value="requirement_owner_client">Client Owner *</MenuItem>
                    <MenuItem value="solution_option_1">Solution Option 1</MenuItem>
                    <MenuItem value="solution_option_1_time_estimate">Time Estimate 1</MenuItem>
                    <MenuItem value="solution_option_2">Solution Option 2</MenuItem>
                    <MenuItem value="solution_option_2_time_estimate">Time Estimate 2</MenuItem>
                    <MenuItem value="solution_option_3">Solution Option 3</MenuItem>
                    <MenuItem value="solution_option_3_time_estimate">Time Estimate 3</MenuItem>
                    <MenuItem value="workshop_name">Workshop Name</MenuItem>
                    <MenuItem value="phase_comments">Phase Comments</MenuItem>
                    <MenuItem value="status_client">Client Status</MenuItem>
                    <MenuItem value="client_comments">Client Comments</MenuItem>
                    <MenuItem value="client_preferences">Client Preferences</MenuItem>
                    <MenuItem disabled>--- Legacy Fields ---</MenuItem>
                    <MenuItem value="solution_option">Solution Option (Legacy)</MenuItem>
                    <MenuItem value="solution_description">Solution Description (Legacy)</MenuItem>
                    <MenuItem value="additional_notes">Additional Notes</MenuItem>
                  </TextField>
                </Grid>
              ))}
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle2" color={allowPartialMapping ? 'text.secondary' : 'error'}>
                {allowPartialMapping ? 
                  'Fields with * are still required in BC RTM' : 
                  '* Required fields'}
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
            
            {allowPartialMapping && skippedRequiredFields.length > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2">
                  Warning: The following required fields are not mapped and will need manual updates after import:
                </Typography>
                <Typography variant="body2">
                  {skippedRequiredFields.join(', ')}
                </Typography>
              </Alert>
            )}
            
            {Object.keys(validationErrors).length > 0 && (
              <Accordion sx={{ mb: 3 }} defaultExpanded>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="validation-errors-content"
                  id="validation-errors-header"
                >
                  <Typography variant="subtitle1" color="error">
                    <Badge badgeContent={Object.keys(validationErrors).length} color="error" sx={{ mr: 2 }}>
                      <WarningIcon color="error" />
                    </Badge>
                    Warning: {Object.keys(validationErrors).length} of {fileData.length} rows have validation errors
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" paragraph>
                    These rows may not be imported correctly. Consider fixing the issues before importing or use "Allow Partial Mapping" option.
                  </Typography>
                  
                  {/* Error Summary by Type */}
                  <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
                    Error Summary:
                  </Typography>
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 1, 
                    mb: 2
                  }}>
                    {Object.entries(validationSummary).map(([errorType, count]) => (
                      <Chip 
                        key={errorType}
                        label={`${errorType.replace('invalid_', 'Invalid ')}: ${count}`}
                        color="error"
                        variant="outlined"
                        onClick={() => handleFixErrors(errorType)}
                      />
                    ))}
                  </Box>
                  
                  <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 'bold' }}>
                    Common Resolution Steps:
                  </Typography>
                  <Box component="ul" sx={{ mt: 1 }}>
                    <li>Check your Excel/CSV file for empty cells in required columns</li>
                    <li>Ensure exact name matching for module, submodule, department names</li>
                    <li>Enable "Allow Partial Mapping" if you want to import with missing fields and fill them later</li>
                    <li>Verify that your master data values match system values exactly (case-sensitive)</li>
                    <li>Download a template with valid master data for reference</li>
                  </Box>
                  
                  {/* Show some example errors */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      Example Errors:
                    </Typography>
                    {Object.entries(validationErrors).slice(0, 3).map(([rowIndex, errors]) => (
                      <Box key={rowIndex} sx={{ mt: 1, border: '1px solid', borderColor: 'error.light', p: 1, borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Row {parseInt(rowIndex) + 1} ({fileData[parseInt(rowIndex)]?.title || 'Unknown'}):
                        </Typography>
                        <Box component="ul" sx={{ mt: 0.5, mb: 0.5 }}>
                          {errors.map((error, i) => (
                            <li key={i}>
                              <Typography variant="body2" color="error.main">
                                {error}
                              </Typography>
                            </li>
                          ))}
                        </Box>
                      </Box>
                    ))}
                    {Object.keys(validationErrors).length > 3 && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        ...and {Object.keys(validationErrors).length - 3} more rows with errors
                      </Typography>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
            
            <TableContainer component={Paper} sx={{ mb: 3, maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    {requiredFields.map((field) => (
                      <TableCell key={field}>
                        {field} {!allowPartialMapping || !skippedRequiredFields.includes(field) ? '*' : ''}
                        {skippedRequiredFields.includes(field) && (
                          <Chip 
                            size="small" 
                            label="Not Mapped" 
                            color="warning" 
                            sx={{ ml: 1, fontSize: '0.6rem' }} 
                          />
                        )}
                      </TableCell>
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
                        sx={{ 
                          backgroundColor: hasError ? 'error.lightest' : undefined,
                          '&:hover': {
                            backgroundColor: hasError ? 'error.lighter' : 'action.hover',
                          }
                        }}
                      >
                        <TableCell>
                          {rowIndex + 1}
                          {hasError && (
                            <Tooltip 
                              title={<>
                                {validationErrors[rowIndex].map((err, i) => (
                                  <div key={i}>{err}</div>
                                ))}
                              </>}
                            >
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
                          const isUnmapped = skippedRequiredFields.includes(field);
                          
                          // Check for specific field validation errors
                          const hasFieldError = hasError && validationErrors[rowIndex].some(
                            err => err.toLowerCase().includes(field.toLowerCase())
                          );
                          
                          return (
                            <TableCell 
                              key={field}
                              sx={{ 
                                color: hasFieldError ? 'error.dark' : 
                                      isMissing && !isUnmapped ? 'error.main' : 
                                      isUnmapped ? 'text.disabled' : undefined,
                                fontStyle: isUnmapped ? 'italic' : 'normal',
                                fontWeight: hasFieldError ? 'bold' : 'normal',
                                backgroundColor: hasFieldError ? 'error.lightest' : undefined
                              }}
                            >
                              {isUnmapped ? '(Will need manual update)' : value || (
                                <Box component="span" sx={{ color: 'error.main' }}>
                                  Missing
                                </Box>
                              )}
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
                              onClick={() => {
                                setError(`Errors in row ${rowIndex + 1}: ${validationErrors[rowIndex].join(', ')}`);
                              }}
                            />
                          ) : allowPartialMapping && skippedRequiredFields.length > 0 ? (
                            <Chip 
                              size="small"
                              label="Needs Review" 
                              color="warning" 
                              icon={<WarningIcon />} 
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
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
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
              
              {Object.keys(validationErrors).length > 0 && !allowPartialMapping && (
                <Chip 
                  label="Enable Partial Mapping" 
                  color="primary" 
                  clickable
                  onClick={() => {
                    setAllowPartialMapping(true);
                    setActiveStep(1);  // Go back to mapping step
                  }}
                  sx={{ ml: 'auto' }}
                />
              )}
            </Box>
            
            {allowPartialMapping && skippedRequiredFields.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> Requirements will be imported with default values for unmapped required fields.
                  Remember to update these fields manually after import.
                </Typography>
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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