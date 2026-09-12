import type { Resource } from './components/CrudPage';

export const documentsRes: Resource = {
  title: 'Documents',
  base: '/admin/documents',
  paged: true,
  hideTitle: true,
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: '__ids', label: 'IDs' },
    { key: 'fileUrl', label: 'File URL' },
    { key: 'documentDate', label: 'Doc Date' },
    { key: 'uploadedAt', label: 'Uploaded' },
    { key: 'updatedAt', label: 'Updated' },
  ],
  fields: [],
  allowDelete: true,
  allowView: true,
};

export const companiesRes: Resource = {
  title: 'Companies',
  base: '/admin/companies',
  paged: true,
  hideTitle: true,
  searchable: true,
  dateRange: true,
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'userId', label: 'User ID', copy: true },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate', label: 'End' },
    { key: 'current', label: 'Current' },
  ],
  fields: [],
  allowDelete: true,
  allowToggle: true,
};

export const subscriptionsRes: Resource = {
  title: 'Subscriptions',
  base: '/admin/subscriptions',
  paged: true,
  hideTitle: true,
  searchable: true,
  columns: [
    { key: 'planCode', label: 'Plan' },
    { key: 'status', label: 'Status' },
    { key: 'userId', label: 'User ID' },
    { key: 'storageLimitBytes', label: 'Storage' },
    { key: 'expiryDate', label: 'Expiry' },
  ],
  fields: [],
};

export const invoicesRes: Resource = {
  title: 'Invoices',
  base: '/admin/invoices',
  paged: true,
  hideTitle: true,
  searchable: true,
  columns: [
    { key: 'invoiceNo', label: 'Invoice No' },
    { key: 'planName', label: 'Plan' },
    { key: 'amountPaise', label: 'Amount (paise)' },
    { key: 'status', label: 'Status' },
    { key: 'issuedAt', label: 'Issued' },
  ],
  fields: [],
};

export const plansRes: Resource = {
  title: 'Plans',
  base: '/admin/plans',
  paged: false,
  hideTitle: true,
  searchable: true,
  columns: [
    { key: 'planName', label: 'Name' },
    { key: 'planCode', label: 'Code' },
    { key: 'period', label: 'Period' },
    { key: 'allocatedBytes', label: 'Bytes' },
    { key: 'amountPaise', label: 'Amount (paise)' },
    { key: 'isActive', label: 'Active' },
  ],
  fields: [
    { key: 'planName', label: 'Name' },
    { key: 'planCode', label: 'Code', readOnly: true },
    { key: 'period', label: 'Period' },
    { key: 'allocatedBytes', label: 'Bytes', type: 'number' },
    { key: 'allocatedUnit', label: 'Unit' },
    { key: 'amountPaise', label: 'Amount (paise)', type: 'number' },
    { key: 'currency', label: 'Currency' },
    { key: 'isActive', label: 'Active (1/0)', type: 'select', options: ['1', '0'] },
    { key: 'isDeleted', label: 'Deleted (1/0)', type: 'select', options: ['0', '1'] },
    { key: 'remarks', label: 'Remarks' },
  ],
  allowCreate: true,
  allowDelete: true,
  allowToggle: true,
  idKey: 'id',
};

export const goalsRes: Resource = {
  title: 'Goals',
  base: '/admin/goals',
  paged: true,
  hideTitle: true,
  searchable: true,
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'userId', label: 'User ID', copy: true },
    { key: 'targetDate', label: 'Target' },
    { key: 'status', label: 'Status' },
  ],
  fields: [],
  allowDelete: true,
  allowToggle: true,
};

export const tasksRes: Resource = {
  title: 'Tasks',
  base: '/admin/todos',
  paged: true,
  hideTitle: true,
  searchable: true,
  fixedParams: { type: 'task' },
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'userId', label: 'User ID', copy: true },
    { key: 'dueDate', label: 'Due' },
    { key: 'completed', label: 'Done' },
  ],
  fields: [],
  allowDelete: true,
  allowToggle: true,
};

export const notesRes: Resource = {
  title: 'Notes',
  base: '/admin/todos',
  paged: true,
  hideTitle: true,
  searchable: true,
  fixedParams: { type: 'note' },
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'userId', label: 'User ID', copy: true },
    { key: 'content', label: 'Content' },
  ],
  fields: [],
  allowDelete: true,
  allowToggle: true,
};

export const customAdsRes: Resource = {
  title: 'Custom Ads',
  base: '/admin/custom-ads',
  paged: false,
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'productImgLink', label: 'Image Link' },
    { key: 'productOpenLink', label: 'Open Link' },
    { key: 'isActive', label: 'Active' },
    { key: 'isDeleted', label: 'Deleted' },
  ],
  fields: [
    { key: 'title', label: 'Title' },
    { key: 'productImgLink', label: 'Image Link' },
    { key: 'productOpenLink', label: 'Open Link' },
    { key: 'isActive', label: 'Active (1/0)', type: 'select', options: ['1', '0'] },
    { key: 'isDeleted', label: 'Deleted (1/0)', type: 'select', options: ['0', '1'] },
    { key: 'remarks', label: 'Remarks' },
  ],
  allowCreate: true,
  allowDelete: true,
  allowToggle: true,
  idKey: 'id',
};

export const remindersRes: Resource = {
  title: 'Reminders',
  base: '/admin/reminders',
  paged: true,
  hideTitle: true,
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'userId', label: 'User ID' },
    { key: 'remindAt', label: 'Remind At' },
  ],
  fields: [],
  allowDelete: true,
  allowToggle: true,
};

export const lookupsRes: Resource = {
  title: 'Lookups',
  base: '/admin/lookups',
  paged: false,
  hideTitle: true,
  columns: [
    { key: 'lookupCode', label: 'Code' },
    { key: 'shortName', label: 'Short' },
    { key: 'isActive', label: 'Active' },
    { key: 'isDeleted', label: 'Deleted' },
  ],
  fields: [
    { key: 'isActive', label: 'Active (1/0)', type: 'select', options: ['1', '0'] },
    { key: 'isDeleted', label: 'Deleted (1/0)', type: 'select', options: ['0', '1'] },
    { key: 'remarks', label: 'Remarks' },
  ],
  allowDelete: true,
  allowToggle: true,
  idKey: 'lookupid',
};

export const adProvidersRes: Resource = {
  title: 'Ad Providers',
  base: '/admin/ad-providers',
  paged: false,
  hideTitle: true,
  columns: [
    { key: 'providerName', label: 'Name' },
    { key: 'platform', label: 'Platform' },
    { key: 'priority', label: 'Priority' },
    { key: 'isActive', label: 'Active' },
  ],
  fields: [
    { key: 'providerName', label: 'Name' },
    { key: 'platform', label: 'Platform' },
    { key: 'priority', label: 'Priority', type: 'number' },
    { key: 'isActive', label: 'Active (1/0)', type: 'select', options: ['1', '0'] },
  ],
  allowCreate: true,
  allowDelete: true,
  allowToggle: true,
  idKey: 'id',
};

export const adConfigsRes: Resource = {
  title: 'Ad Configs',
  base: '/admin/ad-configs',
  paged: false,
  hideTitle: true,
  columns: [
    { key: 'placement', label: 'Placement' },
    { key: 'adType', label: 'Type' },
    { key: 'adUnitId', label: 'Unit ID' },
    { key: 'priority', label: 'Priority' },
    { key: 'isActive', label: 'Active' },
  ],
  fields: [
    { key: 'priority', label: 'Priority', type: 'number' },
    { key: 'isActive', label: 'Active (1/0)', type: 'select', options: ['1', '0'] },
  ],
  allowCreate: true,
  allowDelete: true,
  allowToggle: true,
  idKey: 'id',
};

export const securitySettingsRes: Resource = {
  title: 'Security Config',
  base: '/admin/security-settings',
  paged: false,
  hideTitle: true,
  columns: [
    { key: 'configKey', label: 'Key' },
    { key: 'configValue', label: 'Value' },
    { key: 'description', label: 'Description' },
    { key: 'isActive', label: 'Active' },
  ],
  fields: [
    { key: 'configValue', label: 'Value' },
    { key: 'description', label: 'Description' },
    { key: 'isActive', label: 'Active (1/0)', type: 'select', options: ['1', '0'] },
  ],
  allowToggle: true,
  idKey: 'id',
};

export const paymentConfigsRes: Resource = {
  title: 'Payment Config',
  base: '/admin/payment-configs',
  paged: false,
  hideTitle: true,
  columns: [
    { key: 'provider', label: 'Provider' },
    { key: 'keyId', label: 'Key ID' },
    { key: 'secretKey', label: 'Secret Key' },
  ],
  fields: [
    { key: 'keyId', label: 'Key ID' },
    { key: 'secretKey', label: 'Secret Key' },
    { key: 'isActive', label: 'Active (1/0)', type: 'select', options: ['1', '0'] },
  ],
  allowDelete: true,
  idKey: 'id',
};
