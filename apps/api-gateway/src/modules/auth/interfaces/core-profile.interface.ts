// FILE: apps/api-gateway/src/modules/auth/interfaces/core-profile.interface.ts
/**
 * Core `GET /auth/profile` payload.
 * Envelope: `{ status, message, data: UserData }` — `data` is the user object.
 */
export interface CoreProfileEnvelope {
  status: boolean;
  message: string;
  data: UserData;
}

export interface UserData {
  user_id: string;
  username: string;
  email: string;
  email_verified_at: string;
  employee_id: string;
  language: string;
  last_logged_in: string;
  last_logged_ip: string;
  last_logged_device: string;
  auth_user_applications: AuthUserApplication[];
  auth_user_roles: AuthUserRole[];
  employee: Employee;
}

export interface AuthUserApplication {
  user_id: string;
  application_id: string;
  applications: Application;
}

export interface Application {
  application_id: string;
  application_code: string;
  application_name: string;
  description: string;
}

export interface AuthUserRole {
  user_id: string;
  role_id: string;
  auth_roles: AuthRole;
}

export interface AuthRole {
  role_id: string;
  role_name: string;
  sequence: number;
  description: string;
  created_at: string;
  updated_at: string;
  status: number;
  created_by: string;
  updated_by: string;
  role_type: string;
  role_category: string | null;
  role_is_default: number;
  parent_id: string | null;
  application_id: string;
  auth_role_menu_permissions: AuthRoleMenuPermission[];
  auth_role_menu_data_access: unknown[];
}

export interface AuthRoleMenuPermission {
  role_id: string;
  menu_permission_id: string;
  auth_menu_permissions: AuthMenuPermission;
}

export interface AuthMenuPermission {
  menu_permission_id: string;
  menu_id: string;
  permission_id: string;
  status: number;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  auth_menus: AuthMenu;
  auth_permissions: AuthPermission;
}

export interface AuthMenu {
  menu_id: string;
  application_id: string;
  parent_menu_id: string | null;
  menu_sorting: number;
  menu_key: string;
  menu_name: string;
  menu_category: string;
  menu_link: string;
  menu_class: string;
  menu_icon: string;
  menu_route: string;
  menu_type: string;
  status: number;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  applications: {
    application_code: string;
    application_name: string;
  };
}

export interface AuthPermission {
  permission_id: string;
  permission_name: string;
  description: string;
  permission_key: string;
  permission_category: string;
  status: number;
  sequence: number;
}

export interface Employee {
  id_employee: string;
  salutation: string | null;
  full_name: string;
  nick_name: string | null;
  photo: string | null;
  gender: string;
  birth_date: string;
  age: number | null;
  city_of_birth_place: string | null;
  country_of_birth_place: string | null;
  nationality_id: string | null;
  race_id: string | null;
  sap_internal_order: string | null;
  status: number;
  deleted_at: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  employee_id_number: string;
  employee_job: EmployeeJob;
  employee_status: EmployeeStatus;
  employee_contact: EmployeeContact;
}

export interface EmployeeJob {
  id_employee_job: string;
  work_location_id: string | null;
  division_group_vn: string | null;
  country_id: string;
  company_id: string;
  division_id: string;
  bu_group_id: string;
  department_id: string;
  branch_id: string;
  region_id: string | null;
  state_id: string | null;
  sales_office_id: string | null;
  job_family_id: string | null;
  sub_job_family_id: string | null;
  job_title_id: string;
  career_stream_id: string;
  employee_type_vn: string;
  career_level_id: string;
  direct_superior_appraiser: string | null;
  indirect_superior_reviewer: string | null;
  line_director_reviewer: string | null;
  salesman_code_number: string;
  cost_center_id: string;
  movement_type_id: string | null;
  movement_date: string | null;
  id_employee: string;
  retirement_date: string;
  extended_retirement_date: string | null;
  cm_countries: {
    country_code: string;
    country_name: string;
  };
  cm_companies: {
    company_code: string;
    company_name: string;
    cm_company_types: {
      company_type_code: string;
      company_type_name: string;
    };
  };
  cm_divisions: {
    division_code: string;
    division_name: string;
  };
  cm_departments: {
    department_code: string;
    department_name: string;
    ref_code: string;
    ref_name: string;
  };
  cm_job_titles: {
    job_title_name: string;
    job_title_description: string;
  };
  cm_work_locations: unknown;
  cm_sales_offices: unknown;
  cm_career_streams: {
    career_stream_name: string;
  };
  cm_career_levels: {
    career_level_name: string;
  };
  direct_superior: unknown;
  indirect_superior: unknown;
  line_director: unknown;
}

export interface EmployeeStatus {
  id_employee_status: string;
  employee_status_id: string;
  hire_date: string;
  original_hire_date: string;
  continuous_service_date: string | null;
  confirmation_date: string | null;
  years_of_service: number | null;
  end_of_probation: string | null;
  last_working_day: string | null;
  reason_for_leaving: string | null;
  id_employee: string;
  employee_id_number: string;
  sap_internal_order: string | null;
  cm_employee_statuses: {
    employee_status_name: string;
  };
}

export interface EmployeeContact {
  id_employee_contact: string;
  employee_mobile_number: string | null;
  employee_mobile_number_2: string | null;
  email_address_office: string;
  email_address_personal: string;
  office_phone_number: string | null;
  social_media_accounts: string | null;
  permanent_address_identity_card: string | null;
  address_residence: string | null;
  id_employee: string;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Minimal guard: Core user payload always has `user_id`. */
export function isUserData(value: unknown): value is UserData {
  return isRecord(value) && typeof value['user_id'] === 'string';
}

/** Unwrap `{ data: UserData }`, `{ user: UserData }`, or bare `UserData`. */
export function unwrapCoreProfile(payload: unknown): UserData | null {
  if (isUserData(payload)) {
    return payload;
  }
  if (!isRecord(payload)) {
    return null;
  }

  const nestedData = payload['data'];
  if (isUserData(nestedData)) {
    return nestedData;
  }
  if (isRecord(nestedData) && isUserData(nestedData['user'])) {
    return nestedData['user'];
  }
  if (isUserData(payload['user'])) {
    return payload['user'];
  }
  return null;
}
