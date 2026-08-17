import { AdminPageHeader } from '@/components/admin/ui';
import QuestionBankTabs from '@/components/admin/QuestionBankTabs';
import BulkUpload from '@/components/admin/BulkUpload';

export default function BulkUploadPage() {
  return (
    <div>
      <AdminPageHeader
        title="Bulk upload"
        description="Import many questions at once from a CSV. Every row is validated before anything is committed."
      />
      <QuestionBankTabs />
      <BulkUpload />
    </div>
  );
}
