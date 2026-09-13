import type { Resource } from './components/CrudPage';

export const documentsRes: Resource = {
  title: 'Documents',
  base: '/admin/documents',
  paged: true,
  hideTitle: true,
  searchable: true,
  empty: { icon: '📄', title: 'No documents found', sub: 'Documents added to the workspace will appear here.' },
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' },
    { key: 'userName', label: 'User', subtitle: true, subtitleKey: 'userEmail' },
    { key: 'fileUrl', label: 'File URL' },
    { key: 'uploadedAt', label: 'Uploaded', datetime: true },
    { key: 'isActive', label: 'Active' },
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
  empty: { icon: '🏢', title: 'No companies found', sub: 'Companies added to your workspace will appear here.' },
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'userName', label: 'User', subtitle: true, subtitleKey: 'userEmail' },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate', label: 'End' },
    { key: 'current', label: 'Current', currentBadge: true },
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
    { key: 'planCode', label: 'Plan', plan: true, subtitleKey: 'planName' },
    { key: 'status', label: 'Status' },
    { key: 'userName', label: 'User', subtitle: true, subtitleKey: 'userEmail' },
    { key: 'storageLimitBytes', label: 'Storage', bytes: true },
    { key: 'expiryDate', label: 'Expiry', expiry: true },
    { key: 'isActive', label: 'Active' },
  ],
  fields: [
    { key: 'planCode', label: 'Plan Code' },
    { key: 'planName', label: 'Plan Name' },
    { key: 'status', label: 'Status', type: 'select', options: ['ACTIVE', 'CANCELLED', 'EXPIRED', 'SUSPENDED'] },
    { key: 'storageLimitBytes', label: 'Storage (bytes)', type: 'number' },
    { key: 'maxCompanies', label: 'Max Companies', type: 'number' },
    { key: 'maxDocuments', label: 'Max Documents', type: 'number' },
    { key: 'adsEnabled', label: 'Ads Enabled', type: 'select', options: ['true', 'false'] },
    { key: 'expiryDate', label: 'Expiry Date' },
    { key: 'isActive', label: 'Active (1/0)', type: 'select', options: ['1', '0'] },
  ],
  empty: { icon: '💳', title: 'No subscriptions found', sub: 'Your subscription information will appear here.' },
  allowDelete: true,
  allowToggle: true,
  allowView: true,
  idKey: 'id',
};

export const invoicesRes: Resource = {
  title: 'Invoices',
  base: '/admin/invoices',
  paged: true,
  hideTitle: true,
  searchable: true,
  columns: [
    { key: 'invoiceNo', label: 'Invoice No' },
    { key: 'userName', label: 'User', subtitle: true, subtitleKey: 'userEmail' },
    { key: 'planName', label: 'Plan' },
    { key: 'amount', label: 'Amount', inr: true },
    { key: 'status', label: 'Status' },
    { key: 'issuedAt', label: 'Issued', datetime: true },
    { key: 'isActive', label: 'Active' },
  ],
  fields: [
    { key: 'invoiceNo', label: 'Invoice No', readOnly: true },
    { key: 'planCode', label: 'Plan Code' },
    { key: 'planName', label: 'Plan Name' },
    { key: 'amount', label: 'Amount', type: 'number' },
    { key: 'currency', label: 'Currency' },
    { key: 'status', label: 'Status', type: 'select', options: ['PAID', 'PENDING', 'FAILED', 'CANCELLED', 'REFUNDED'] },
    { key: 'isActive', label: 'Active (1/0)', type: 'select', options: ['1', '0'] },
  ],
  empty: { icon: '🧾', title: 'No invoices found', sub: 'Issued invoices will appear here.' },
  allowDelete: true,
  allowToggle: true,
  allowView: true,
  idKey: 'id',
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
    { key: 'allocatedBytes', label: 'Storage', bytes: true },
    { key: 'amount', label: 'Amount', inr: true },
    { key: 'isActive', label: 'Active' },
  ],
  fields: [
    { key: 'planName', label: 'Name' },
    { key: 'planCode', label: 'Code', readOnly: true },
    { key: 'period', label: 'Period' },
    { key: 'allocatedBytes', label: 'Bytes', type: 'number' },
    { key: 'allocatedUnit', label: 'Unit' },
    { key: 'amount', label: 'Amount', type: 'number' },
    { key: 'currency', label: 'Currency' },
    { key: 'isActive', label: 'Active (1/0)', type: 'select', options: ['1', '0'] },
    { key: 'isDeleted', label: 'Deleted (1/0)', type: 'select', options: ['0', '1'] },
    { key: 'remarks', label: 'Remarks' },
  ],
  allowCreate: true,
  allowDelete: true,
  allowToggle: true,
  idKey: 'id',
  empty: { icon: '📦', title: 'No plans found', sub: 'Create your first plan to get started.' },
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
    { key: 'userName', label: 'User', subtitle: true, subtitleKey: 'userEmail' },
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
    { key: 'userName', label: 'User', subtitle: true, subtitleKey: 'userEmail' },
    { key: 'dueDate', label: 'Due', datetime: true },
    { key: 'completed', label: 'Done', iconBool: true },
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
    { key: 'userName', label: 'User', subtitle: true, subtitleKey: 'userEmail' },
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

export const packDownloadsRes: Resource = {
  title: 'Pack Downloads',
  base: '/admin/pack-downloads',
  paged: true,
  hideTitle: true,
  allowDelete: true,
  empty: { icon: '📦', title: 'No downloads yet', sub: 'Pack downloads will appear here once users download.' },
  columns: [
    { key: 'userName', label: 'User', subtitle: true, subtitleKey: 'userEmail' },
    { key: 'packId', label: 'Pack ID', copy: true },
    { key: 'downloadCount', label: 'Count' },
    { key: 'active', label: 'Active' },
    { key: 'downloadedAt', label: 'Downloaded At', datetime: true },
    { key: 'createdAt', label: 'Created At', datetime: true },
  ],
  fields: [],
};

export const remindersRes: Resource = {
  title: 'Reminders',
  base: '/admin/reminders',
  paged: true,
  hideTitle: true,
  columns: [
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type', humanize: true },
    { key: 'userName', label: 'User', subtitle: true, subtitleKey: 'userEmail' },
    { key: 'remindAt', label: 'Remind At', datetime: true },
    { key: 'isActive', label: 'Status', activeStatus: true },
  ],
  fields: [],
  allowDelete: true,
  allowToggle: true,
  empty: { icon: '🔔', title: 'No reminders yet', sub: 'Create your first reminder to stay organized and on schedule.' },
};

export const lookupsRes: Resource = {
  title: 'Lookups',
  base: '/admin/lookups',
  paged: false,
  hideTitle: true,
  columns: [
    { key: 'lookupCode', label: 'Code' },
    { key: 'shortName', label: 'Short' },
    { key: 'longName', label: 'Long Name' },
    { key: 'parentLookupId', label: 'Parent ID' },
    { key: 'sortedOrder', label: 'Order' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'isActive', label: 'Active' },
    { key: 'isDeleted', label: 'Deleted' },
  ],
  fields: [
    { key: 'lookupCode', label: 'Code' },
    { key: 'shortName', label: 'Short' },
    { key: 'longName', label: 'Long Name' },
    { key: 'parentLookupId', label: 'Parent ID', type: 'number' },
    { key: 'sortedOrder', label: 'Order', type: 'number' },
    { key: 'isActive', label: 'Active (1/0)', type: 'select', options: ['1', '0'] },
    { key: 'isDeleted', label: 'Deleted (1/0)', type: 'select', options: ['0', '1'] },
    { key: 'remarks', label: 'Remarks' },
  ],
  allowCreate: true,
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
