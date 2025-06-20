import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound as UsersRound, PlusCircle, Search, ListFilter, Plane, FileText, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/contexts/LocaleContext';
import { motion } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HumanResourcesPage() {
  const { t } = useLocale();
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [hireDate, setHireDate] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('Technique');
  const [salary, setSalary] = useState('');
  const [contractType, setContractType] = useState('CDI');
  const [address, setAddress] = useState('');

  const handleNewEmployee = () => {
    setShowEmployeeForm(true);
  };

  const handleBackToList = () => {
    setShowEmployeeForm(false);
  };

  const handleSubmit = () => {
    // Ici, vous pourriez ajouter une validation et l'envoi des données
    toast({
      title: t('success'),
      description: t('humanresourcespage.employe_ajoute', { defaultValue: 'Employé ajouté avec succès' })
    });
    setShowEmployeeForm(false);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('humanResources')}</h1>
          <p className="text-muted-foreground">{t('humanresourcespage.grez_votre_personnel_congs_notes_de_frais_et_paie', { defaultValue: 'Gérez votre personnel, congés, notes de frais et paie.' })}</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={handleNewEmployee}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('humanresourcespage.ajouter_employe', { defaultValue: 'Ajouter Employé' })}
          </Button>
        </motion.div>
      </div>

      {showEmployeeForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('humanresourcespage.nouvel_employ', { defaultValue: 'Nouvel Employé' })}</CardTitle>
            <CardDescription>{t('humanresourcespage.ajoutez_un_nouveau_membre_votre_quipe', { defaultValue: 'Ajoutez un nouveau membre à votre équipe' })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="employee-firstname" className="text-sm font-medium">{t('humanresourcespage.prnom', { defaultValue: 'Prénom' })}</label>
                <Input 
                  id="employee-firstname" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jean" 
                />
              </div>
              <div>
                <label htmlFor="employee-lastname" className="text-sm font-medium">{t('humanresourcespage.nom', { defaultValue: 'Nom' })}</label>
                <Input 
                  id="employee-lastname" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dupont" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="employee-email" className="text-sm font-medium">{t('humanresourcespage.email_professionnel', { defaultValue: 'Email professionnel' })}</label>
                <Input 
                  id="employee-email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean.dupont@entreprise.com" 
                  type="email" 
                />
              </div>
              <div>
                <label htmlFor="employee-phone" className="text-sm font-medium">{t('humanresourcespage.tlphone', { defaultValue: 'Téléphone' })}</label>
                <Input 
                  id="employee-phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01 23 45 67 89" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="employee-position" className="text-sm font-medium">{t('humanresourcespage.poste', { defaultValue: 'Poste' })}</label>
                <Input 
                  id="employee-position" 
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Développeur Senior" 
                />
              </div>
              <div>
                <label htmlFor="employee-department" className="text-sm font-medium">{t('humanresourcespage.dpartement', { defaultValue: 'Département' })}</label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="employee-department">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technique">{t('humanresourcespage.technique', { defaultValue: 'Technique' })}</SelectItem>
                    <SelectItem value="Commercial">{t('humanresourcespage.commercial', { defaultValue: 'Commercial' })}</SelectItem>
                    <SelectItem value="Marketing">{t('humanresourcespage.marketing', { defaultValue: 'Marketing' })}</SelectItem>
                    <SelectItem value="Administration">{t('humanresourcespage.administration', { defaultValue: 'Administration' })}</SelectItem>
                    <SelectItem value="Direction">{t('humanresourcespage.direction', { defaultValue: 'Direction' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="employee-hire-date" className="text-sm font-medium">{t('humanresourcespage.date_dembauche', { defaultValue: 'Date d\'embauche' })}</label>
                <DatePicker
                  value={hireDate}
                  onChange={setHireDate}
                  placeholder={t('humanresourcespage.slectionnez_une_date', { defaultValue: 'Sélectionnez une date' })}
                />
              </div>
              <div>
                <label htmlFor="employee-salary" className="text-sm font-medium">{t('humanresourcespage.salaire_brut_mois', { defaultValue: 'Salaire brut (€/mois)' })}</label>
                <Input 
                  id="employee-salary" 
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="3500" 
                  type="number" 
                />
              </div>
              <div>
                <label htmlFor="employee-contract-type" className="text-sm font-medium">{t('humanresourcespage.type_de_contrat', { defaultValue: 'Type de contrat' })}</label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger id="employee-contract-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDI">CDI</SelectItem>
                    <SelectItem value="CDD">CDD</SelectItem>
                    <SelectItem value="Stage">{t('humanresourcespage.stage', { defaultValue: 'Stage' })}</SelectItem>
                    <SelectItem value="Freelance">{t('humanresourcespage.freelance', { defaultValue: 'Freelance' })}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label htmlFor="employee-address" className="text-sm font-medium">{t('humanresourcespage.adresse', { defaultValue: 'Adresse' })}</label>
              <Input 
                id="employee-address" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Rue de la Paix, 75001 Paris" 
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleBackToList} variant="outline">{t('humanresourcespage.annuler', { defaultValue: 'Annuler' })}</Button>
              <Button onClick={handleSubmit}>{t('humanresourcespage.ajouter_lemploy', { defaultValue: 'Ajouter l\'employé' })}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <CardTitle>{t('humanresourcespage.liste_des_employs', { defaultValue: 'Liste des Employés' })}</CardTitle>
                <CardDescription>{t('humanresourcespage.consultez_et_grez_les_fiches_de_vos_salaris', { defaultValue: 'Consultez et gérez les fiches de vos salariés.' })}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder={t('humanresourcespage.rechercher_employ', { defaultValue: 'Rechercher employé...' })} className="pl-8 w-full md:w-[250px]" />
                </div>
                <Button variant="outline" size="icon"><ListFilter className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <UsersRound className="mx-auto h-16 w-16 text-primary/50" />
              <p className="mt-4 text-lg text-muted-foreground">{t('humanresourcespage.aucun_employ_enregistr', { defaultValue: 'Aucun employé enregistré' })}</p>
              <p className="text-sm text-muted-foreground mb-4">{t('humanresourcespage.commencez_par_ajouter_votre_premier_employ', { defaultValue: 'Commencez par ajouter votre premier employé' })}</p>
              <Button onClick={handleNewEmployee}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('humanresourcespage.premier_employe', { defaultValue: 'Premier employé' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plane className="text-blue-500"/>{t('humanresourcespage.congs_absences', { defaultValue: 'Congés & Absences' })}</CardTitle></CardHeader>
          <CardContent className="h-[150px] flex items-center justify-center">
            <p className="text-muted-foreground">{t('comingSoon')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="text-green-500"/>{t('humanresourcespage.notes_de_frais', { defaultValue: 'Notes de Frais' })}</CardTitle></CardHeader>
          <CardContent className="h-[150px] flex items-center justify-center">
            <p className="text-muted-foreground">{t('comingSoon')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="text-yellow-500"/>{t('humanresourcespage.prparation_paie', { defaultValue: 'Préparation Paie' })}</CardTitle></CardHeader>
          <CardContent className="h-[150px] flex items-center justify-center">
            <p className="text-muted-foreground">{t('comingSoon')}</p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}