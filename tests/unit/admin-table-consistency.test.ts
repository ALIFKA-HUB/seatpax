import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SERVER_PAGINATED_PAGES = [
  'app/admin/companies/[companyId]/trips/page.tsx',
  'app/admin/companies/[companyId]/routes/page.tsx',
  'app/admin/companies/[companyId]/vehicles/page.tsx',
  'app/admin/companies/[companyId]/seat-templates/page.tsx',
  'app/admin/companies/[companyId]/service-classes/page.tsx',
  'app/admin/companies/[companyId]/payment-conflicts/page.tsx',
  'app/admin/companies/[companyId]/helpdesk-staff/page.tsx',
];

const ALL_TABLE_VIEWS = [
  ...SERVER_PAGINATED_PAGES,
  'app/admin/components/stop-directory.tsx',
  'app/helpdesk/components/case-list.tsx',
];

describe('Admin PO unified table layout and pagination contract', () => {
  it('uses unified admin-table-card, AdminEmptyState, and shared pagination across every Admin PO table view', () => {
    for (const file of ALL_TABLE_VIEWS) {
      const source = readFileSync(file, 'utf8');
      expect(source).toContain('admin-table-card');
      expect(source).toContain('admin-panel-head');
      expect(source).not.toContain('admin-empty-copy');
      if (SERVER_PAGINATED_PAGES.includes(file)) {
        expect(source).toContain('AdminPaginatedTable');
        expect(source).toContain('AdminEmptyState');
      } else if (file.endsWith('stop-directory.tsx')) {
        expect(source).toContain('AdminPaginationBar');
        expect(source).toContain('AdminEmptyState');
        expect(source).toContain('admin-modern-table');
        expect(source).not.toContain('stop-panel');
        expect(source).not.toContain('stop-table');
      } else {
        expect(source).toContain('AdminPaginationBar');
        expect(source).toContain('admin-modern-table');
      }
    }
  });

  it('keeps Status columns free of technical revision/version suffixes and aligns interactive action columns via admin-col-action', () => {
    for (const file of ALL_TABLE_VIEWS) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toContain('Status / revisi');
      expect(source).not.toContain('Status / versi');
      if (!file.endsWith('helpdesk-staff/page.tsx')) {
        expect(source).toContain('admin-col-action');
        expect(source).toContain('>Aksi<');
      }
    }

    for (const detailFile of [
      'app/admin/companies/[companyId]/vehicles/[vehicleId]/page.tsx',
      'app/admin/companies/[companyId]/seat-templates/[templateId]/page.tsx',
      'app/admin/companies/[companyId]/trips/[tripId]/page.tsx',
      'app/admin/components/vehicle-form.tsx',
      'app/admin/components/seat-template-builder.tsx',
    ]) {
      const source = readFileSync(detailFile, 'utf8');
      expect(source).not.toMatch(/revisi \{|versi \{|Revisi \$\{|Versi \$\{/);
    }
  });
});
