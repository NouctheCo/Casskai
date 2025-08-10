import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { useToast } from '../ui/use-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { supabase } from '../../lib/supabase';
import { Loader2, PlusCircle, Building, CheckCircle } from 'lucide-react';
import CompanyFormSection from './CompanyFormSection';
import { countries, currencies } from '../../lib/formData';

const CompanySelector = ({ onCompanySelected }) => {
  const { user, userCompanies, loading: authLoading, refreshUserAccess } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCountry, setNewCompanyCountry] = useState(countries[0].code);
  const [newCompanyCurrency, setNewCompanyCurrency] = useState(currencies[0].code);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  useEffect(() => {
    if (!authLoading && userCompanies?.length === 1 && !showCreateForm) {
      const singleCompany = userCompanies[0];
      if (singleCompany?.company) {
        handleCompanySelect(singleCompany.company.id, singleCompany.company.name);
      }
    }
  }, [userCompanies, authLoading, showCreateForm]);

  const getDefaultAdminRoleId = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'Admin')
      .is('company_id', null)
      .eq('is_system_role', true)
      .single();

    if (error || !data) {
      // If no system Admin role exists, create one
      const { data: newRole, error: createError } = await supabase
        .from('roles')
        .insert({
          name: 'Admin',
          description: 'System administrator role with all permissions',
          is_system_role: true
        })
        .select()
        .single();
        
      if (createError) throw new Error(t('adminRoleFetchError', { defaultValue: "Admin role not found and could not be created." }));
      return newRole.id;
    }
    
    return data.id;
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!user) return toast({ variant: 'destructive', title: t('error'), description: t('userNotAuthenticatedError', { defaultValue: "User not authenticated." }) });

    setIsCreating(true);
    try {
      const adminRoleId = await getDefaultAdminRoleId();

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{ name: newCompanyName, country: newCompanyCountry, default_currency: newCompanyCurrency, is_active: true }])
        .select()
        .single();

      if (companyError || !company) throw companyError;

      const { error: linkError } = await supabase
        .from('user_companies')
        .insert([{
          user_id: user.id,
          company_id: company.id,
          role_id: adminRoleId,
          is_default: !userCompanies?.length
        }]);

      if (linkError) throw linkError;

      toast({ title: t('success'), description: t('companyCreatedSuccess', { defaultValue: `Company \"${newCompanyName}\" created.` }) });
      await refreshUserAccess();
      handleCompanySelect(company.id, company.name);

      setShowCreateForm(false);
      setNewCompanyName('');
      setNewCompanyCountry(countries[0].code);
      setNewCompanyCurrency(currencies[0].code);

    } catch (err) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCompanySelect = (id, name) => {
    setSelectedCompanyId(id);
    toast({
      title: t('companySelectedToastTitle', { defaultValue: "Company Selected" }),
      description: t('companySelectedToastDescription', { defaultValue: `You are now working with ${name}.` }),
      duration: 2000,
    });
    setTimeout(() => onCompanySelected(id), 500);
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{t('loadingCompanies', { defaultValue: "Loading companies..." })}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/10 p-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-2xl">
        <Card className="shadow-xl bg-card/80 backdrop-blur-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{t('selectCompanyTitle', { defaultValue: "Select Company" })}</CardTitle>
            <CardDescription>{t('selectCompanyDescription', { defaultValue: "Choose or create a company to begin." })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {showCreateForm ? (
                <motion.form
                  key="create-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleCreateCompany}
                  className="space-y-4"
                >
                  <CompanyFormSection
                    companyName={newCompanyName}
                    setCompanyName={setNewCompanyName}
                    companyCountry={newCompanyCountry}
                    setCompanyCountry={setNewCompanyCountry}
                    companyCurrency={newCompanyCurrency}
                    setCompanyCurrency={setNewCompanyCurrency}
                    isLoading={isCreating}
                  />
                  <div className="flex gap-4 mt-6">
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} disabled={isCreating} className="w-full">
                      {t('cancelButton', { defaultValue: "Cancel" })}
                    </Button>
                    <Button type="submit" disabled={isCreating || !newCompanyName} className="w-full">
                      {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                      {t('createButton', { defaultValue: "Create" })}
                    </Button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="company-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {userCompanies?.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userCompanies.map(({ company, role }) => company && (
                        <motion.div
                          key={company.id}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          onClick={() => handleCompanySelect(company.id, company.name)}
                          className={`p-4 rounded-lg border cursor-pointer relative ${
                            selectedCompanyId === company.id ? 'bg-primary/10 ring-2 ring-primary' : 'bg-card hover:bg-muted'
                          }`}
                        >
                          {selectedCompanyId === company.id && (
                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="absolute top-2 right-2 text-primary">
                              <CheckCircle size={20} />
                            </motion.div>
                          )}
                          <div className="flex items-center mb-2">
                            <Building className="h-6 w-6 mr-2 text-primary" />
                            <h3 className="text-lg font-semibold">{company.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{t('roleLabel', { defaultValue: "Role" })}: {role?.name || t('notAssigned', { defaultValue: 'N/A' })}</p>
                          <p className="text-xs text-muted-foreground">{company.country} - {company.default_currency}</p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground">{t('noCompaniesFound', { defaultValue: "No companies found." })}</p>
                  )}
                  <Button onClick={() => setShowCreateForm(true)} className="w-full mt-4">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    {t('createNewCompanyButton', { defaultValue: "Create New Company" })}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        <motion.p
          className="mt-6 text-center text-xs text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          © {new Date().getFullYear()} {t('appName')}. {t('allRightsReserved')}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default CompanySelector;