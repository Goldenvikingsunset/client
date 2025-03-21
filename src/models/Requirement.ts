interface SolutionOption {
  description: string;
  timeEstimate: number | null;
}

export class Requirement {
  // Core fields
  public id: number;
  public title: string;
  public description: string;
  public priority: string;
  public status: string;

  // Business Central fields
  public businessCentralDepartment: string;
  public functionalArea: string;
  public isTemplateItem: boolean;

  // Consultant and owner fields
  public functionalConsultant: string;
  public requirementOwnerClient: string;

  // Solution design fields
  public solutionOptions: {
    option1: SolutionOption;
    option2: SolutionOption;
    option3: SolutionOption;
  };

  // Workshop and phase fields
  public workshopName: string;
  public phaseComments: string;

  // Client assessment fields
  public statusClient: string;
  public clientComments: string;
  public clientPreferences: string;

  constructor(data: Partial<Requirement> = {}) {
    // Core fields with validation
    this.id = data.id || 0;
    this.title = this.validateTitle(data.title || '');
    this.description = data.description || '';
    this.priority = data.priority || '';
    this.status = data.status || '';

    // Business Central fields
    this.businessCentralDepartment = data.businessCentralDepartment || '';
    this.functionalArea = data.functionalArea || '';
    this.isTemplateItem = data.isTemplateItem || false;

    // Consultant and owner fields
    this.functionalConsultant = data.functionalConsultant || '';
    this.requirementOwnerClient = data.requirementOwnerClient || '';

    // Solution options with validation
    this.solutionOptions = {
      option1: this.validateSolutionOption(data.solutionOptions?.option1),
      option2: this.validateSolutionOption(data.solutionOptions?.option2),
      option3: this.validateSolutionOption(data.solutionOptions?.option3)
    };

    // Workshop and phase fields
    this.workshopName = data.workshopName || '';
    this.phaseComments = data.phaseComments || '';

    // Client assessment fields
    this.statusClient = data.statusClient || '';
    this.clientComments = data.clientComments || '';
    this.clientPreferences = data.clientPreferences || '';
  }

  private validateTitle(title: string): string {
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (title.length > 255) {
      throw new Error('Title must be less than 255 characters');
    }
    return title.trim();
  }

  private validateSolutionOption(option: SolutionOption | undefined): SolutionOption {
    return {
      description: option?.description || '',
      timeEstimate: this.validateTimeEstimate(option?.timeEstimate)
    };
  }

  private validateTimeEstimate(estimate: number | null | undefined): number | null {
    if (estimate === undefined || estimate === null) {
      return null;
    }
    if (estimate < 0) {
      throw new Error('Time estimate cannot be negative');
    }
    return estimate;
  }

  public validate(): boolean {
    // Required fields validation
    if (!this.title) throw new Error('Title is required');
    if (!this.businessCentralDepartment) throw new Error('Business Central Department is required');
    if (!this.functionalArea) throw new Error('Functional Area is required');
    if (!this.functionalConsultant) throw new Error('Functional Consultant is required');
    if (!this.requirementOwnerClient) throw new Error('Requirement Owner (Client) is required');
    
    // At least one solution option must have a description
    if (!this.solutionOptions.option1.description && 
        !this.solutionOptions.option2.description && 
        !this.solutionOptions.option3.description) {
      throw new Error('At least one solution option must be provided');
    }

    return true;
  }

  public toJSON(): object {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      priority: this.priority,
      status: this.status,
      businessCentralDepartment: this.businessCentralDepartment,
      functionalArea: this.functionalArea,
      isTemplateItem: this.isTemplateItem,
      functionalConsultant: this.functionalConsultant,
      requirementOwnerClient: this.requirementOwnerClient,
      solutionOptions: this.solutionOptions,
      workshopName: this.workshopName,
      phaseComments: this.phaseComments,
      statusClient: this.statusClient,
      clientComments: this.clientComments,
      clientPreferences: this.clientPreferences
    };
  }
}
