import { ReactNode } from "react";

// Auth Types
export interface User {
  user_id: number;
  username: string;
  email: string;
  role: 'Admin' | 'Consultant' | 'Client';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// RTM Data Types
export interface Module {
  module_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubModule {
  submodule_id: number;
  module_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  Module?: Module;
}

export interface Function {
  function_id: number;
  submodule_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  SubModule?: SubModule;
}

export interface Priority {
  priority_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Status {
  status_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FitGapStatus {
  fitgap_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SolutionOption {
  option_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BCFunctionalDepartment {
  description: ReactNode;
  id: number;
  name: string;
}

export interface FunctionalArea {
  id: number;
  department_id: number;
  name: string;
  description?: string | null;
  BCFunctionalDepartment?: BCFunctionalDepartment;
}

export interface Requirement {
  req_id: number;
  title: string;
  description: string | null;
  details: string | null;
  function_id: number;
  priority_id: number;
  status_id: number;
  phase: string | null;
  in_scope: boolean;
  option_id: number | null;
  fitgap_id: number | null;
  comments: string | null;
  // New BC RTM fields
  business_central_functional_department: number | null;
  functional_area: number | null;
  bc_department_id: number | null;
  functional_area_id: number | null;
  template_item: boolean;
  functional_consultant: string | null;
  requirement_owner_client: string | null;
  solution_option_1: string | null;
  solution_option_1_time_estimate: number | null;
  solution_option_2: string | null;
  solution_option_2_time_estimate: number | null;
  solution_option_3: string | null;
  solution_option_3_time_estimate: number | null;
  workshop_name: string | null;
  phase_comments: string | null;
  status_client: string | null;
  client_comments: string | null;
  client_preferences: string | null;
  // Timestamps and relations
  created_at: string;
  updated_at: string;
  requirement_creator?: User;
  requirement_updater?: User;
  requirement_changes?: ChangeLog[];
  Function?: Function;
  Priority?: Priority;
  Status?: Status;
  FitGapStatus?: FitGapStatus;
  SolutionOption?: SolutionOption;
  // Original associations with standard naming
  BCFunctionalDepartment?: BCFunctionalDepartment;
  FunctionalArea?: FunctionalArea;
  // Adding the backend model associations with their actual aliases
  bc_department?: BCFunctionalDepartment;
  functional_area_relation?: FunctionalArea;
}

export interface ChangeLog {
  log_id: number;
  req_id: number;
  user_id: number;
  change_type: 'Create' | 'Update' | 'Delete';
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  timestamp: string;
  change_author?: User;
  changed_requirement?: Requirement;
}

export interface RequirementTemplate {
  template_id: number;
  name: string;
  description?: string;
  fields: {
    title?: string;
    description?: string;
    details?: string;
    comments?: string;
    [key: string]: any;
  };
  function_id?: number;
  priority_id?: number;
  status_id?: number;
  Function?: Function;
  Priority?: Priority;
  Status?: Status;
  created_by?: number;
  updated_by?: number;
  created_by_user?: User;
  created_at: string;
  updated_at: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  filters: {
    module_id?: string;
    submodule_id?: string;
    function_id?: string;
    priority_id?: string;
    status_id?: string;
    fitgap_id?: string;
    phase?: string;
    search?: string;
  };
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface RequirementsResponse {
  requirements: Requirement[];
  pagination: PaginationInfo;
}

export interface RequirementResponse {
  requirement: Requirement;
}

export interface StatsResponse {
  totalRequirements: number;
  priorityStats: Array<{
    priority_id: number;
    count: number;
    'Priority.name': string;
  }>;
  statusStats: Array<{
    status_id: number;
    count: number;
    'Status.name': string;
  }>;
  fitGapStats: Array<{
    fitgap_id: number;
    count: number;
    'FitGapStatus.name': string;
  }>;
  moduleStats: Array<{
    count: number;
    'Function->SubModule->Module.module_id': number;
    'Function->SubModule->Module.name': string;
  }>;
  departmentStats: Array<{
    count: number;
    'BCFunctionalDepartment.id': number;
    'BCFunctionalDepartment.name': string;
  }>;
  solutionOptionStats: Array<{
    count: number;
    'SolutionOption.id': number;
    'SolutionOption.name': string;
  }>;
  clientStatusStats: Array<{
    status: string;
    count: number;
  }>;
  recentChanges: ChangeLog[];
}

// Form Types
export interface LoginForm {
  username: string;
  password: string;
}

export interface RegisterForm extends LoginForm {
  email: string;
  confirmPassword: string;
  role: 'Admin' | 'Consultant' | 'Client';
}

export interface PasswordResetRequestForm {
  email: string;
}

export interface PasswordResetForm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RequirementForm {
  title: string;
  description: string | null;
  details?: string | null;  // Updated to allow null and make it optional
  module: string | number;
  submodule: string | number;
  function: string;
  function_id?: number | null;
  priority: string | number;
  priority_id?: number | null;
  status: string | number;
  status_id?: number | null;
  fitgap: string | number;
  fitgap_id?: number | null;
  phase?: string | null;
  in_scope?: boolean;
  option_id?: number | null;
  comments?: string | null;
  // BC RTM specific fields
  business_central_functional_department?: string | number | null;
  bc_department_id?: number | null;
  functional_area?: string | number | null;
  functional_area_id?: number | null;
  template_item?: boolean;
  functional_consultant?: string | null;
  requirement_owner_client?: string | null;
  solution_option_1?: string | null;
  solution_option_1_time_estimate?: number | null;
  solution_option_2?: string | null;
  solution_option_2_time_estimate?: number | null;
  solution_option_3?: string | null;
  solution_option_3_time_estimate?: number | null;
  workshop_name?: string | null;
  phase_comments?: string | null;
  status_client?: string | null;
  client_comments?: string | null;
  client_preferences?: string | null;
  needs_review?: boolean;
}

export interface Requirement extends RequirementForm {
  id: number;
  created_at: string;
  updated_at: string;
}