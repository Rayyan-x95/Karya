import React, { useState, useEffect } from 'react';
import { SettingsLayout } from '../layout/SettingsLayout';
import { Input, Textarea, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Containers';
import { Spinner } from '../ui/Feedback';
import { PageHeader } from '../ui/PageHeader';
import { Section } from '../ui/Section';
import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';
import { ProfileSchema, WorkspaceSettingsSchema } from '../../schemas';

interface SettingsTemplateProps {
  workspaceId: string;
  profileId: string;
  addToast: (type: 'success' | 'info' | 'warning' | 'error', message: string, desc?: string) => void;
}

export const SettingsTemplate: React.FC<SettingsTemplateProps> = ({
  workspaceId,
  profileId,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const { profile, settings, isLoading, updateProfile, updateSettings } = useWorkspaceSettings(workspaceId, profileId);
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');

  // Workspace Settings state
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [gstType, setGstType] = useState('regular');
  const [bankName, setBankName] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [upiVpa, setUpiVpa] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setProfileEmail(profile.email || '');
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name || '');
      setGstin(settings.gstin || '');
      setBankName(settings.bank_name || '');
      setBankAcc(settings.bank_account_no || '');
      setBankIfsc(settings.bank_ifsc || '');
      setUpiVpa(settings.upi_id || '');
      setAddress(settings.address || '');
      setProfilePhone(settings.phone || '');
    }
  }, [settings]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      
      // Validate with Zod schema
      const validated = ProfileSchema.parse({
        full_name: fullName,
        email: profileEmail,
      });
      
      await updateProfile({
        full_name: validated.full_name,
        email: validated.email,
      });
      addToast('success', 'Profile Updated Successfully');
    } catch (e: any) {
      addToast('error', 'Profile Update Failed', e.message || 'Validation failed');
    } finally {
      setSaving(false);
    }
  };

  const saveBanking = async () => {
    try {
      setSaving(true);
      
      // Validate with Zod schema
      const validated = WorkspaceSettingsSchema.parse({
        company_name: companyName || null,
        bank_name: bankName || null,
        bank_account_no: bankAcc || null,
        bank_ifsc: bankIfsc || null,
        upi_id: upiVpa || null,
      });
      
      await updateSettings({
        bank_name: validated.bank_name,
        bank_account_no: validated.bank_account_no,
        bank_ifsc: validated.bank_ifsc,
        upi_id: validated.upi_id,
        company_name: validated.company_name,
      });
      addToast('success', 'Banking & UPI Info Saved');
    } catch (e: any) {
      addToast('error', 'Banking Update Failed', e.message || 'Validation failed');
    } finally {
      setSaving(false);
    }
  };

  const saveGst = async () => {
    try {
      setSaving(true);
      
      // Validate with Zod schema
      const validated = WorkspaceSettingsSchema.parse({
        gstin: gstin || null,
        address: address || null,
        phone: profilePhone || null,
      });
      
      await updateSettings({
        gstin: validated.gstin,
        address: validated.address,
        phone: validated.phone,
      });
      addToast('success', 'Branding & GST Info Saved');
    } catch (e: any) {
      addToast('error', 'GST Update Failed', e.message || 'Validation failed');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-3">
        <Spinner size="lg" />
        <span className="text-xs text-muted-foreground">Loading settings panel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your profile, banking, and workspace preferences."
      />

      <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'profile' && (
          <Section title="Profile & account" description="This information appears on your invoices and proposals.">
            <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={fullName} size="xl" />
              <div>
                <p className="text-body font-medium text-foreground m-0">{fullName || 'Freelancer'}</p>
                <p className="text-small text-muted-foreground m-0">{profileEmail}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
              <Input label="Email" type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} />
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={saveProfile} loading={saving}>Save changes</Button>
            </div>
            </div>
          </Section>
        )}

        {activeTab === 'banking' && (
          <Section title="Banking & UPI" description="Used for generating payment QR codes on invoices.">
            <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="UPI ID / VPA" placeholder="yourname@upi" value={upiVpa} onChange={e => setUpiVpa(e.target.value)} />
              <Input label="Display name" placeholder="Rohan Sharma" value={companyName} onChange={e => setCompanyName(e.target.value)} />
              <Input label="Bank name" placeholder="HDFC Bank" value={bankName} onChange={e => setBankName(e.target.value)} />
              <Input label="Account number" placeholder="501002345..." value={bankAcc} onChange={e => setBankAcc(e.target.value)} />
              <Input label="IFSC code" placeholder="HDFC0000123" value={bankIfsc} onChange={e => setBankIfsc(e.target.value)} />
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={saveBanking} loading={saving}>Save banking info</Button>
            </div>
            </div>
          </Section>
        )}

        {activeTab === 'branding' && (
          <Section title="Branding & GST" description="These details appear on all client-facing documents.">
            <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="GSTIN" placeholder="22AAAAA0000A1Z5" value={gstin} onChange={e => setGstin(e.target.value)} />
              <Select label="GST registration type" options={[
                { value: 'regular', label: 'Regular' },
                { value: 'composition', label: 'Composition scheme' },
                { value: 'unregistered', label: 'Unregistered' },
              ]} value={gstType} onChange={e => setGstType(e.target.value)} />
              <Input label="Contact phone" placeholder="9876543210" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} />
            </div>
            <Textarea label="Company address" placeholder="Street, state, PIN..." value={address} onChange={e => setAddress(e.target.value)} />
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={saveGst} loading={saving}>Save GST settings</Button>
            </div>
            </div>
          </Section>
        )}
      </SettingsLayout>
    </div>
  );
};
