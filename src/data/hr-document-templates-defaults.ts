/**
 * Templates de documents RH par défaut
 * Prêts à être importés dans la base de données
 */

import type { DocumentTemplateFormData } from '@/types/hr-document-templates.types';
import { STANDARD_VARIABLES } from '@/types/hr-document-templates.types';

// =====================================================
// CONTRAT CDI
// =====================================================

export const TEMPLATE_CDI: DocumentTemplateFormData = {
  name: "Contrat à Durée Indéterminée (CDI)",
  description: "Modèle de contrat CDI standard conforme au Code du travail français",
  category: "contract",
  template_type: "cdi",
  requires_signature: true,
  auto_archive: true,
  variables: [
    ...STANDARD_VARIABLES,
    { name: 'trial_period_months', type: 'number', label: 'Période d\'essai (mois)', default_value: 2 },
    { name: 'benefits', type: 'string', label: 'Avantages', description: 'Tickets restaurant, mutuelle, etc.' },
    { name: 'notice_period', type: 'string', label: 'Préavis', default_value: '1 mois' }
  ],
  content: `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <h1 style="text-align: center; color: #1a365d;">CONTRAT DE TRAVAIL<br/>À DURÉE INDÉTERMINÉE</h1>

  <p style="margin: 30px 0;"><strong>ENTRE LES SOUSSIGNÉS :</strong></p>

  <div style="margin-left: 30px;">
    <p><strong>{{company_name}}</strong><br/>
    SIRET : {{company_siret}}<br/>
    Adresse : {{company_address}}<br/>
    Téléphone : {{company_phone}}<br/>
    Email : {{company_email}}</p>

    <p>Ci-après dénommée « l'Employeur »</p>

    <p><strong>D'UNE PART,</strong></p>
  </div>

  <div style="margin: 30px 0 30px 30px;">
    <p><strong>{{employee_title}} {{employee_full_name}}</strong><br/>
    Né(e) le : {{employee_birth_date}}<br/>
    À : {{employee_birth_place}}<br/>
    Domicilié(e) : {{employee_address}}<br/>
    N° Sécurité sociale : {{employee_social_security}}</p>

    <p>Ci-après dénommé(e) « le Salarié »</p>

    <p><strong>D'AUTRE PART,</strong></p>
  </div>

  <p style="margin: 30px 0;"><strong>IL A ÉTÉ CONVENU CE QUI SUIT :</strong></p>

  <h2 style="color: #2c5282;">ARTICLE 1 – ENGAGEMENT</h2>
  <p>L'Employeur engage le Salarié en qualité de <strong>{{position}}</strong>, au sein du département <strong>{{department}}</strong>, à compter du <strong>{{start_date}}</strong>.</p>
  <p>Le présent contrat est conclu pour une durée indéterminée.</p>

  <h2 style="color: #2c5282;">ARTICLE 2 – PÉRIODE D'ESSAI</h2>
  <p>Le contrat débute par une période d'essai de <strong>{{trial_period_months}} mois</strong>, renouvelable une fois, conformément aux dispositions légales et conventionnelles en vigueur.</p>
  <p>Pendant cette période, le contrat pourra être rompu par l'une ou l'autre des parties, moyennant le respect d'un délai de prévenance conforme aux dispositions légales.</p>

  <h2 style="color: #2c5282;">ARTICLE 3 – FONCTIONS</h2>
  <p>Le Salarié exercera les fonctions de <strong>{{position}}</strong>. Ces fonctions comportent notamment :</p>
  <ul>
    <li>L'exécution des tâches inhérentes au poste</li>
    <li>Le respect des procédures internes de l'entreprise</li>
    <li>La contribution aux objectifs fixés par sa hiérarchie</li>
  </ul>

  <h2 style="color: #2c5282;">ARTICLE 4 – LIEU DE TRAVAIL</h2>
  <p>Le lieu de travail habituel du Salarié est situé à :</p>
  <p style="margin-left: 30px;"><strong>{{company_address}}</strong></p>
  <p>Le Salarié pourra être amené à se déplacer dans le cadre de ses fonctions.</p>

  <h2 style="color: #2c5282;">ARTICLE 5 – DURÉE DU TRAVAIL</h2>
  <p>Le Salarié est engagé à temps plein sur la base de <strong>{{work_hours_weekly}} heures</strong> par semaine.</p>
  <p>Les horaires de travail sont : <strong>{{work_schedule}}</strong></p>

  <h2 style="color: #2c5282;">ARTICLE 6 – RÉMUNÉRATION</h2>
  <p>Le Salarié percevra une rémunération brute mensuelle de <strong>{{salary}}</strong>, payable le dernier jour ouvré du mois.</p>
  <p>Le salaire net estimé est de <strong>{{salary_net}}</strong> (après déduction des cotisations sociales obligatoires).</p>
  <p>Cette rémunération pourra être révisée annuellement en fonction des résultats de l'entreprise et de l'évaluation des performances du Salarié.</p>

  <h2 style="color: #2c5282;">ARTICLE 7 – CONGÉS PAYÉS</h2>
  <p>Le Salarié bénéficie de congés payés conformément aux dispositions légales et conventionnelles en vigueur, soit 2,5 jours ouvrables par mois de travail effectif.</p>

  <h2 style="color: #2c5282;">ARTICLE 8 – AVANTAGES SOCIAUX</h2>
  <p>Le Salarié bénéficie des avantages suivants :</p>
  <p style="margin-left: 30px;">{{benefits}}</p>

  <h2 style="color: #2c5282;">ARTICLE 9 – CONFIDENTIALITÉ</h2>
  <p>Le Salarié s'engage à respecter la plus stricte confidentialité concernant toutes les informations de l'entreprise dont il aura connaissance dans le cadre de ses fonctions.</p>

  <h2 style="color: #2c5282;">ARTICLE 10 – RÉSILIATION</h2>
  <p>Le contrat pourra être résilié par l'une ou l'autre des parties moyennant le respect d'un préavis de <strong>{{notice_period}}</strong>, conformément aux dispositions légales et conventionnelles.</p>

  <h2 style="color: #2c5282;">ARTICLE 11 – CONVENTION COLLECTIVE</h2>
  <p>Le présent contrat est régi par les dispositions de la Convention Collective applicable dans l'entreprise.</p>

  <div style="margin-top: 60px; page-break-inside: avoid;">
    <p>Fait à <strong>{{signature_place}}</strong>, le <strong>{{current_date}}</strong></p>
    <p>En deux exemplaires originaux, dont un remis au Salarié.</p>

    <div style="display: flex; justify-content: space-between; margin-top: 40px;">
      <div style="text-align: center; width: 45%;">
        <p><strong>L'Employeur</strong></p>
        <p style="margin-top: 80px; border-top: 1px solid #000; padding-top: 5px;">{{company_name}}</p>
      </div>

      <div style="text-align: center; width: 45%;">
        <p><strong>Le Salarié</strong></p>
        <p style="margin-top: 80px; border-top: 1px solid #000; padding-top: 5px;">{{employee_full_name}}</p>
      </div>
    </div>
  </div>
</div>
`
};

// =====================================================
// CONTRAT CDD
// =====================================================

export const TEMPLATE_CDD: DocumentTemplateFormData = {
  name: "Contrat à Durée Déterminée (CDD)",
  description: "Modèle de contrat CDD conforme au Code du travail français",
  category: "contract",
  template_type: "cdd",
  requires_signature: true,
  auto_archive: true,
  variables: [
    ...STANDARD_VARIABLES,
    { name: 'cdd_reason', type: 'string', label: 'Motif du CDD', required: true, description: 'Remplacement, accroissement temporaire d\'activité, etc.' },
    { name: 'replaced_employee', type: 'string', label: 'Employé remplacé (si remplacement)' },
    { name: 'contract_duration', type: 'string', label: 'Durée du contrat', required: true },
    { name: 'renewal_possible', type: 'string', label: 'Renouvellement possible', validation: { options: ['Oui', 'Non'] } }
  ],
  content: `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <h1 style="text-align: center; color: #1a365d;">CONTRAT DE TRAVAIL<br/>À DURÉE DÉTERMINÉE</h1>

  <p style="margin: 30px 0;"><strong>ENTRE LES SOUSSIGNÉS :</strong></p>

  <div style="margin-left: 30px;">
    <p><strong>{{company_name}}</strong><br/>
    SIRET : {{company_siret}}<br/>
    Adresse : {{company_address}}</p>
    <p>Ci-après dénommée « l'Employeur »</p>
    <p><strong>D'UNE PART,</strong></p>
  </div>

  <div style="margin: 30px 0 30px 30px;">
    <p><strong>{{employee_title}} {{employee_full_name}}</strong><br/>
    Né(e) le : {{employee_birth_date}}<br/>
    Domicilié(e) : {{employee_address}}</p>
    <p>Ci-après dénommé(e) « le Salarié »</p>
    <p><strong>D'AUTRE PART,</strong></p>
  </div>

  <p style="margin: 30px 0;"><strong>IL A ÉTÉ CONVENU CE QUI SUIT :</strong></p>

  <h2 style="color: #2c5282;">ARTICLE 1 – ENGAGEMENT ET MOTIF</h2>
  <p>L'Employeur engage le Salarié en qualité de <strong>{{position}}</strong> pour une durée déterminée.</p>
  <p><strong>Motif du recours au CDD :</strong> {{cdd_reason}}</p>
  <p>{{replaced_employee}}</p>

  <h2 style="color: #2c5282;">ARTICLE 2 – DURÉE DU CONTRAT</h2>
  <p>Le présent contrat prendra effet le <strong>{{start_date}}</strong> et prendra fin le <strong>{{end_date}}</strong>.</p>
  <p>Durée totale : <strong>{{contract_duration}}</strong></p>
  <p>Renouvellement : <strong>{{renewal_possible}}</strong></p>

  <h2 style="color: #2c5282;">ARTICLE 3 – RÉMUNÉRATION</h2>
  <p>Le Salarié percevra une rémunération brute mensuelle de <strong>{{salary}}</strong>.</p>
  <p>En fin de contrat, le Salarié percevra une indemnité de fin de contrat égale à 10% de la rémunération brute totale, sauf exceptions légales.</p>

  <h2 style="color: #2c5282;">ARTICLE 4 – DURÉE DU TRAVAIL</h2>
  <p>Le Salarié est engagé à temps plein sur la base de <strong>{{work_hours_weekly}} heures</strong> par semaine.</p>

  <div style="margin-top: 60px;">
    <p>Fait à <strong>{{signature_place}}</strong>, le <strong>{{current_date}}</strong></p>
    <div style="display: flex; justify-content: space-between; margin-top: 40px;">
      <div style="text-align: center; width: 45%;">
        <p><strong>L'Employeur</strong></p>
        <p style="margin-top: 80px; border-top: 1px solid #000; padding-top: 5px;">{{company_name}}</p>
      </div>
      <div style="text-align: center; width: 45%;">
        <p><strong>Le Salarié</strong></p>
        <p style="margin-top: 80px; border-top: 1px solid #000; padding-top: 5px;">{{employee_full_name}}</p>
      </div>
    </div>
  </div>
</div>
`
};

// =====================================================
// CERTIFICAT DE TRAVAIL
// =====================================================

export const TEMPLATE_CERTIFICAT_TRAVAIL: DocumentTemplateFormData = {
  name: "Certificat de Travail",
  description: "Certificat de travail délivré à la fin du contrat",
  category: "certificate",
  template_type: "certificat_travail",
  requires_signature: true,
  auto_archive: true,
  variables: [
    ...STANDARD_VARIABLES,
    { name: 'leaving_date', type: 'date', label: 'Date de départ', required: true },
    { name: 'leaving_reason', type: 'string', label: 'Motif du départ' }
  ],
  content: `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <h1 style="text-align: center; color: #1a365d;">CERTIFICAT DE TRAVAIL</h1>

  <p style="margin: 40px 0;">Je soussigné(e), représentant(e) de :</p>

  <div style="margin-left: 30px; margin-bottom: 30px;">
    <p><strong>{{company_name}}</strong><br/>
    SIRET : {{company_siret}}<br/>
    Adresse : {{company_address}}</p>
  </div>

  <p>Certifie avoir employé :</p>

  <div style="margin-left: 30px; margin-bottom: 30px;">
    <p><strong>{{employee_title}} {{employee_full_name}}</strong><br/>
    Né(e) le : {{employee_birth_date}}<br/>
    N° Sécurité sociale : {{employee_social_security}}</p>
  </div>

  <p><strong>En qualité de :</strong> {{position}}</p>
  <p><strong>Du :</strong> {{start_date}} <strong>au :</strong> {{leaving_date}}</p>

  <p style="margin: 30px 0;">Le présent certificat est délivré pour servir et valoir ce que de droit.</p>

  <p><strong>Motif du départ :</strong> {{leaving_reason}}</p>

  <div style="margin-top: 80px;">
    <p>Fait à <strong>{{signature_place}}</strong>, le <strong>{{current_date}}</strong></p>

    <div style="margin-top: 60px; text-align: right;">
      <p><strong>Pour {{company_name}}</strong></p>
      <p style="margin-top: 80px; border-top: 1px solid #000; padding-top: 5px; display: inline-block; min-width: 200px;">Signature et cachet</p>
    </div>
  </div>
</div>
`
};

// =====================================================
// AVENANT DE SALAIRE
// =====================================================

export const TEMPLATE_AVENANT_SALAIRE: DocumentTemplateFormData = {
  name: "Avenant - Augmentation de Salaire",
  description: "Avenant au contrat de travail pour modification de salaire",
  category: "amendment",
  template_type: "avenant_salaire",
  requires_signature: true,
  auto_archive: true,
  variables: [
    ...STANDARD_VARIABLES,
    { name: 'previous_salary', type: 'currency', label: 'Ancien salaire', required: true },
    { name: 'new_salary', type: 'currency', label: 'Nouveau salaire', required: true },
    { name: 'increase_percentage', type: 'number', label: 'Pourcentage d\'augmentation' },
    { name: 'effective_date', type: 'date', label: 'Date d\'effet', required: true }
  ],
  content: `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <h1 style="text-align: center; color: #1a365d;">AVENANT AU CONTRAT DE TRAVAIL<br/>Modification de la rémunération</h1>

  <p style="margin: 30px 0;"><strong>ENTRE LES SOUSSIGNÉS :</strong></p>

  <div style="margin-left: 30px;">
    <p><strong>{{company_name}}</strong><br/>
    SIRET : {{company_siret}}<br/>
    Adresse : {{company_address}}</p>
    <p>Ci-après dénommée « l'Employeur »</p>
    <p><strong>D'UNE PART,</strong></p>
  </div>

  <div style="margin: 30px 0 30px 30px;">
    <p><strong>{{employee_title}} {{employee_full_name}}</strong><br/>
    Engagé(e) depuis le {{start_date}}<br/>
    En qualité de {{position}}</p>
    <p>Ci-après dénommé(e) « le Salarié »</p>
    <p><strong>D'AUTRE PART,</strong></p>
  </div>

  <p style="margin: 30px 0;"><strong>IL A ÉTÉ CONVENU CE QUI SUIT :</strong></p>

  <h2 style="color: #2c5282;">ARTICLE 1 – OBJET</h2>
  <p>Le présent avenant a pour objet de modifier l'article du contrat de travail relatif à la rémunération.</p>

  <h2 style="color: #2c5282;">ARTICLE 2 – NOUVELLE RÉMUNÉRATION</h2>
  <p>À compter du <strong>{{effective_date}}</strong>, la rémunération brute mensuelle du Salarié sera de :</p>
  <p style="margin-left: 30px; font-size: 1.2em;"><strong>{{new_salary}}</strong></p>
  <p>Au lieu de <strong>{{previous_salary}}</strong> précédemment.</p>
  <p>Soit une augmentation de <strong>{{increase_percentage}}%</strong>.</p>

  <h2 style="color: #2c5282;">ARTICLE 3 – AUTRES DISPOSITIONS</h2>
  <p>Toutes les autres clauses du contrat de travail initial demeurent inchangées et continuent de s'appliquer.</p>

  <div style="margin-top: 60px;">
    <p>Fait à <strong>{{signature_place}}</strong>, le <strong>{{current_date}}</strong></p>
    <p>En deux exemplaires originaux.</p>

    <div style="display: flex; justify-content: space-between; margin-top: 40px;">
      <div style="text-align: center; width: 45%;">
        <p><strong>L'Employeur</strong></p>
        <p style="margin-top: 80px; border-top: 1px solid #000; padding-top: 5px;">{{company_name}}</p>
      </div>
      <div style="text-align: center; width: 45%;">
        <p><strong>Le Salarié</strong></p>
        <p style="margin-top: 80px; border-top: 1px solid #000; padding-top: 5px;">{{employee_full_name}}</p>
      </div>
    </div>
  </div>
</div>
`
};

// =====================================================
// PROMESSE D'EMBAUCHE
// =====================================================

export const TEMPLATE_PROMESSE_EMBAUCHE: DocumentTemplateFormData = {
  name: "Promesse d'Embauche",
  description: "Promesse d'embauche / Offre de travail écrite",
  category: "letter",
  template_type: "promesse_embauche",
  requires_signature: true,
  auto_archive: true,
  variables: STANDARD_VARIABLES,
  content: `
<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px;">
  <div style="text-align: right; margin-bottom: 40px;">
    <p><strong>{{company_name}}</strong><br/>
    {{company_address}}<br/>
    {{company_phone}}<br/>
    {{company_email}}</p>
  </div>

  <div style="margin: 40px 0;">
    <p><strong>{{employee_title}} {{employee_full_name}}</strong><br/>
    {{employee_address}}</p>
  </div>

  <p style="text-align: right;">{{signature_place}}, le {{current_date}}</p>

  <p style="margin: 40px 0;"><strong>Objet : Promesse d'embauche</strong></p>

  <p>{{employee_title}},</p>

  <p>Nous avons le plaisir de vous confirmer notre décision de vous recruter au sein de notre entreprise.</p>

  <p>Nous vous proposons le poste de <strong>{{position}}</strong> au sein du département <strong>{{department}}</strong>.</p>

  <h3 style="color: #2c5282;">Conditions de l'embauche :</h3>
  <ul>
    <li><strong>Date de prise de fonction :</strong> {{start_date}}</li>
    <li><strong>Type de contrat :</strong> CDI</li>
    <li><strong>Rémunération brute mensuelle :</strong> {{salary}}</li>
    <li><strong>Durée du travail :</strong> {{work_hours_weekly}} heures par semaine</li>
    <li><strong>Lieu de travail :</strong> {{company_address}}</li>
  </ul>

  <p>Cette proposition d'embauche est faite sous réserve :</p>
  <ul>
    <li>De la fourniture des documents nécessaires à votre embauche</li>
    <li>Des résultats de la visite médicale d'embauche</li>
  </ul>

  <p>Nous vous remercions de bien vouloir nous confirmer par écrit votre acceptation de cette offre dans un délai de <strong>7 jours</strong> à compter de la réception de ce courrier.</p>

  <p>Dans l'attente de vous compter parmi nos collaborateurs, nous vous prions d'agréer, {{employee_title}}, l'expression de nos salutations distinguées.</p>

  <div style="margin-top: 60px; text-align: right;">
    <p><strong>Pour {{company_name}}</strong></p>
    <p style="margin-top: 80px; border-top: 1px solid #000; padding-top: 5px; display: inline-block; min-width: 200px;">Signature et cachet</p>
  </div>

  <div style="margin-top: 80px; border-top: 2px solid #000; padding-top: 20px;">
    <p><strong>ACCEPTATION PAR LE CANDIDAT</strong></p>
    <p>Je soussigné(e) <strong>{{employee_full_name}}</strong>, accepte la proposition d'embauche qui m'est faite dans les conditions énoncées ci-dessus.</p>

    <div style="margin-top: 40px;">
      <p>Fait à _________________________, le _________________________</p>
      <p style="margin-top: 40px;">Signature du candidat :</p>
    </div>
  </div>
</div>
`
};

// =====================================================
// EXPORT DE TOUS LES TEMPLATES
// =====================================================

export const DEFAULT_HR_TEMPLATES: DocumentTemplateFormData[] = [
  TEMPLATE_CDI,
  TEMPLATE_CDD,
  TEMPLATE_CERTIFICAT_TRAVAIL,
  TEMPLATE_AVENANT_SALAIRE,
  TEMPLATE_PROMESSE_EMBAUCHE
];

// Labels pour l'interface
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  // Contrats
  cdi: 'CDI - Contrat à Durée Indéterminée',
  cdd: 'CDD - Contrat à Durée Déterminée',
  stage: 'Convention de Stage',
  apprentissage: 'Contrat d\'Apprentissage',
  professionnalisation: 'Contrat de Professionnalisation',
  interim: 'Contrat Intérimaire',
  promesse_embauche: 'Promesse d\'Embauche',

  // Avenants
  avenant_salaire: 'Avenant - Salaire',
  avenant_poste: 'Avenant - Changement de Poste',
  avenant_horaires: 'Avenant - Modification Horaires',
  avenant_lieu: 'Avenant - Changement de Lieu',
  avenant_temps_partiel: 'Avenant - Temps Partiel',
  avenant_temps_plein: 'Avenant - Temps Plein',

  // Certificats
  certificat_travail: 'Certificat de Travail',
  attestation_employeur: 'Attestation Employeur',
  attestation_salaire: 'Attestation de Salaire',
  solde_tout_compte: 'Solde de Tout Compte',

  // Notifications
  notification_embauche: 'Notification d\'Embauche',
  notification_rupture: 'Notification de Rupture',
  avertissement: 'Avertissement',
  mise_pied: 'Mise à Pied',
  licenciement: 'Lettre de Licenciement',

  // Lettres
  lettre_bienvenue: 'Lettre de Bienvenue',
  lettre_felicitations: 'Lettre de Félicitations',
  lettre_promotion: 'Lettre de Promotion',
  lettre_mutation: 'Lettre de Mutation',
  lettre_demission: 'Lettre de Démission'
};
