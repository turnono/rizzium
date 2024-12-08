export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  instructions: string;
  capabilities: AgentCapability[];
  currentTask?: TaskDefinition;
  model: AgentModel;
}

export interface TaskDefinition {
  id: string;
  description: string;
  priority: TaskPriority;
  requiredCapabilities: AgentCapability[];
  metadata?: {
    type: string;
    platform: string;
    target: string;
  };
}

export interface TaskResult {
  success: boolean;
  output: string;
  taskId?: string;
  error?: string;
}

export enum AgentType {
  WORKER = 'worker',
  MANAGER = 'manager',
  SPECIALIST = 'specialist',
  COORDINATOR = 'coordinator',
}

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  OFFLINE = 'offline',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export type AgentModel = 'gpt-4' | 'gpt-3.5-turbo';

export type AgentCapability =
  // Implementation
  | 'code_implementation'
  | 'file_system_operations'
  | 'route_management'
  | 'component_implementation'
  | 'firebase_implementation'
  | 'style_implementation'
  // Architecture & Design
  | 'solution_architecture'
  | 'information_architecture'
  | 'design_patterns'
  | 'design_thinking'
  | 'user_flows'
  | 'wireframing'
  | 'prototyping'
  | 'micro_interactions'
  | 'interaction_design'
  | 'user_research'
  | 'usability_testing'
  | 'accessibility_design'
  | 'system_design'
  // Firebase & Backend
  | 'firebase_project_setup'
  | 'iam_role_management'
  | 'api_enablement'
  | 'github_secrets_management'
  | 'workspace_navigation'
  | 'dependency_management'
  | 'library_organization'
  | 'component_placement'
  | 'code_review'
  | 'testing'
  | 'documentation'
  | 'debugging'
  | 'optimization'
  | 'research'
  | 'task_management'
  | 'task_delegation'
  | 'progress_tracking'
  | 'stakeholder_communication'
  | 'quality_assurance'
  | 'angular_architecture'
  | 'angular_signals'
  | 'angular_material'
  | 'ionic_components'
  | 'standalone_components'
  | 'dependency_injection'
  | 'change_detection'
  | 'angular_routing'
  | 'guards_interceptors'
  | 'angular_forms'
  | 'angular_animations'
  | 'angular_schematics'
  | 'angular_testing'
  | 'angular_pwa'
  | 'state_management'
  | 'rxjs_observables'
  | 'ngrx_signals'
  | 'data_persistence'
  | 'caching_strategies'
  | 'ui_component_library'
  | 'scss_styling'
  | 'responsive_design'
  | 'accessibility'
  | 'atomic_design'
  | 'design_systems'
  | 'css_architecture'
  | 'theme_management'
  | 'i18n_l10n'
  | 'storybook_development'
  | 'performance_optimization'
  | 'bundle_optimization'
  | 'lazy_loading'
  | 'web_vitals'
  | 'memory_management'
  | 'angular_upgrades'
  | 'nx_workspace'
  | 'library_architecture'
  | 'module_federation'
  | 'shared_libraries'
  | 'dependency_graph'
  | 'project_structure'
  | 'unit_testing'
  | 'e2e_testing'
  | 'cypress_testing'
  | 'jest_testing'
  | 'test_coverage'
  | 'performance_testing'
  | 'github_actions'
  | 'deployment_strategies'
  | 'environment_management'
  | 'build_optimization'
  | 'security_best_practices'
  | 'error_handling'
  | 'logging_monitoring'
  | 'firebase_hosting'
  | 'firebase_authentication'
  | 'firestore_database'
  | 'realtime_database'
  | 'cloud_storage'
  | 'cloud_functions'
  | 'cloud_messaging'
  | 'security_rules'
  | 'authentication_flows'
  | 'authorization_strategies'
  | 'data_validation'
  | 'database_optimization'
  | 'query_optimization'
  | 'offline_persistence'
  | 'performance_monitoring'
  | 'ci_cd_pipelines'
  | 'firebase_emulators'
  | 'firebase_sdk_integration'
  | 'data_modeling'
  | 'data_migration'
  | 'backup_recovery'
  | 'data_indexing'
  | 'data_security'
  | 'firebase_testing'
  | 'security_rules_testing'
  | 'function_testing'
  | 'integration_testing'
  | 'resource_optimization'
  | 'cost_monitoring'
  | 'quota_management'
  | 'scaling_strategies'
  | 'coding_standards'
  | 'typescript_standards'
  | 'angular_standards'
  | 'firebase_standards'
  | 'solution_design'
  | 'ux_design'
  | 'ui_design'
  | 'learning_experience_design'
  | 'educational_content_structure'
  | 'progress_tracking_design'
  | 'assessment_design';
