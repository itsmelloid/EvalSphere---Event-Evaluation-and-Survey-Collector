export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const getStatusBadge = (status) => ({
  Upcoming: 'badge-amber', Ongoing: 'badge-green', Completed: 'badge-teal',
  Cancelled: 'badge-red', Archived: 'badge-purple',
}[status] || 'badge-blue');

export const getApprovalBadge = (status) => ({
  Pending: 'badge-amber', Approved: 'badge-green', Rejected: 'badge-red',
}[status] || 'badge-blue');

export const getRoleBadge = (role) => ({
  admin: 'badge-purple', staff: 'badge-blue', user: 'badge-green',
}[role] || 'badge-blue');

export const getInitials = (first = '', last = '') =>
  `${first[0] || ''}${last[0] || ''}`.toUpperCase();

export const truncate = (str, n = 40) => str?.length > n ? str.substring(0, n) + '...' : str;

export const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

export const CHART_COLORS = ['#3D7FFF','#A855F7','#22C55E','#F59E0B','#14B8A6','#EF4444'];

export const QUESTION_TYPES = [
  { value: 'rating',          label: 'Rating Scale (1–5)' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'yes_no',          label: 'Yes / No' },
  { value: 'text',            label: 'Text Feedback' },
  { value: 'checkbox',        label: 'Checkbox' },
  { value: 'dropdown',        label: 'Dropdown' },
];

export const EVENT_CATEGORIES = [
  'Technology','Education','Training','Health','Finance','Marketing','HR','Operations','Other',
];
