/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

/**
 * Service d'export SEPA XML (pain.001.001.03)
 * Génération de fichiers de virement compatibles banques européennes
 */

import { formatCurrency } from '@/lib/utils';

export interface SEPAConfig {
  companyName: string;
  debtorName?: string;
  iban: string;
  bic: string;
  customerId?: string;
  streetName?: string;
  postCode?: string;
  townName?: string;
  country: string;
}

export interface SEPAPayment {
  creditorName: string;
  creditorIban: string;
  creditorBic: string;
  amount: number;
  reference: string;
  remittanceInfo?: string;
  executionDate?: Date;
}

class SEPAExportService {
  /**
   * Génère un fichier SEPA XML au format pain.001.001.03
   */
  generatePain001(
    config: SEPAConfig,
    payments: SEPAPayment[],
    executionDate: Date = new Date()
  ): string {
    const messageId = `SEPA-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase();
    const creationDateTime = new Date().toISOString();
    const nbOfTxs = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const paymentInfoId = `PMT-${Date.now()}`;
    const execDateStr = executionDate.toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${this.escapeXml(messageId)}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${this.escapeXml(config.companyName)}</Nm>`;

    if (config.customerId) {
      xml += `
        <Id>
          <OrgId>
            <Othr>
              <Id>${this.escapeXml(config.customerId)}</Id>
            </Othr>
          </OrgId>
        </Id>`;
    }

    xml += `
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${this.escapeXml(paymentInfoId)}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${nbOfTxs}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl>
          <Cd>SEPA</Cd>
        </SvcLvl>
      </PmtTpInf>
      <ReqdExctnDt>${execDateStr}</ReqdExctnDt>
      <Dbtr>
        <Nm>${this.escapeXml(config.debtorName || config.companyName)}</Nm>`;

    if (config.streetName || config.postCode || config.townName) {
      xml += `
        <PstlAdr>`;
      if (config.streetName) {
        xml += `
          <StrtNm>${this.escapeXml(config.streetName)}</StrtNm>`;
      }
      if (config.postCode) {
        xml += `
          <PstCd>${this.escapeXml(config.postCode)}</PstCd>`;
      }
      if (config.townName) {
        xml += `
          <TwnNm>${this.escapeXml(config.townName)}</TwnNm>`;
      }
      xml += `
          <Ctry>${config.country || 'FR'}</Ctry>
        </PstlAdr>`;
    }

    xml += `
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>${config.iban.replace(/\s/g, '').toUpperCase()}</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>${config.bic.toUpperCase()}</BIC>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>`;

    // Ajouter chaque paiement
    for (const payment of payments) {
      const endToEndId = payment.reference.substring(0, 35);
      const remittance = (payment.remittanceInfo || `Paiement ${payment.reference}`).substring(0, 140);

      xml += `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${this.escapeXml(endToEndId)}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${payment.amount.toFixed(2)}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BIC>${payment.creditorBic.toUpperCase()}</BIC>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>${this.escapeXml(payment.creditorName)}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${payment.creditorIban.replace(/\s/g, '').toUpperCase()}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>${this.escapeXml(remittance)}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
    }

    xml += `
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

    return xml;
  }

  /**
   * Échappe les caractères XML spéciaux
   */
  escapeXml(text: string): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Valide un IBAN selon l'algorithme modulo 97
   */
  validateIBAN(iban: string): boolean {
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    if (cleaned.length < 15 || cleaned.length > 34) return false;

    // Vérifier que les 2 premiers caractères sont des lettres
    if (!/^[A-Z]{2}/.test(cleaned)) return false;

    // Déplacer les 4 premiers caractères à la fin
    const rearranged = cleaned.substring(4) + cleaned.substring(0, 4);

    // Convertir les lettres en chiffres (A=10, B=11, etc.)
    let numericStr = '';
    for (const char of rearranged) {
      if (char >= 'A' && char <= 'Z') {
        numericStr += (char.charCodeAt(0) - 55).toString();
      } else {
        numericStr += char;
      }
    }

    // Vérifier le modulo 97
    let remainder = 0;
    for (let i = 0; i < numericStr.length; i++) {
      remainder = (remainder * 10 + parseInt(numericStr[i])) % 97;
    }

    return remainder === 1;
  }

  /**
   * Valide un BIC/SWIFT
   */
  validateBIC(bic: string): boolean {
    const cleaned = bic.replace(/\s/g, '').toUpperCase();
    // BIC: 8 ou 11 caractères
    // Format: AAAA BB CC DDD
    // AAAA = Bank code (4 lettres)
    // BB = Country code (2 lettres)
    // CC = Location code (2 lettres ou chiffres)
    // DDD = Branch code (3 lettres ou chiffres, optionnel)
    return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned);
  }

  /**
   * Télécharge le XML généré
   */
  async downloadXML(xml: string, fileName: string): Promise<void> {
    const blob = new Blob([xml], { type: 'application/xml; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Formate un IBAN avec des espaces pour la lisibilité
   */
  formatIBAN(iban: string): string {
    const cleaned = iban.replace(/\s/g, '').toUpperCase();
    return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  }

  /**
   * Génère un nom de fichier SEPA standard
   */
  generateFileName(prefix: string = 'SEPA'): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    return `${prefix}_${dateStr}_${timeStr}.xml`;
  }

  /**
   * Valide une configuration SEPA
   */
  validateConfig(config: SEPAConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.companyName || config.companyName.trim().length === 0) {
      errors.push('Le nom de l\'entreprise est requis');
    }

    if (!config.iban || !this.validateIBAN(config.iban)) {
      errors.push('L\'IBAN est invalide');
    }

    if (!config.bic || !this.validateBIC(config.bic)) {
      errors.push('Le BIC est invalide');
    }

    if (!config.country || config.country.length !== 2) {
      errors.push('Le code pays doit être sur 2 lettres (ex: FR, DE, BE)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide une liste de paiements
   */
  validatePayments(payments: SEPAPayment[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!payments || payments.length === 0) {
      errors.push('Aucun paiement à exporter');
      return { valid: false, errors };
    }

    payments.forEach((payment, index) => {
      if (!payment.creditorName || payment.creditorName.trim().length === 0) {
        errors.push(`Paiement ${index + 1}: Le nom du bénéficiaire est requis`);
      }

      if (!payment.creditorIban || !this.validateIBAN(payment.creditorIban)) {
        errors.push(`Paiement ${index + 1}: L'IBAN du bénéficiaire est invalide`);
      }

      if (!payment.creditorBic || !this.validateBIC(payment.creditorBic)) {
        errors.push(`Paiement ${index + 1}: Le BIC du bénéficiaire est invalide`);
      }

      if (!payment.amount || payment.amount <= 0) {
        errors.push(`Paiement ${index + 1}: Le montant doit être supérieur à 0`);
      }

      if (payment.amount > 999999999.99) {
        errors.push(`Paiement ${index + 1}: Le montant est trop élevé (max: ${formatCurrency(999999999.99)})`);
      }

      if (!payment.reference || payment.reference.trim().length === 0) {
        errors.push(`Paiement ${index + 1}: La référence est requise`);
      }

      if (payment.reference && payment.reference.length > 35) {
        errors.push(`Paiement ${index + 1}: La référence ne doit pas dépasser 35 caractères`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse un fichier Excel/CSV pour extraire les paiements
   */
  parsePaymentsFromCSV(csvContent: string): SEPAPayment[] {
    const payments: SEPAPayment[] = [];
    const lines = csvContent.split('\n').filter(l => l.trim());

    if (lines.length < 2) return payments;

    // En-têtes
    const headers = lines[0].split(/[,;]/).map(h =>
      h.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );

    // Mapper les colonnes
    const colMap = {
      name: headers.findIndex(h => h.includes('nom') || h.includes('name') || h.includes('beneficiaire')),
      iban: headers.findIndex(h => h.includes('iban')),
      bic: headers.findIndex(h => h.includes('bic') || h.includes('swift')),
      amount: headers.findIndex(h => h.includes('montant') || h.includes('amount')),
      reference: headers.findIndex(h => h.includes('reference') || h.includes('ref') || h.includes('motif')),
      description: headers.findIndex(h => h.includes('libelle') || h.includes('description'))
    };

    // Données
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/"/g, ''));

      const getValue = (idx: number) => idx >= 0 && idx < values.length ? values[idx] : '';

      const name = getValue(colMap.name);
      const iban = getValue(colMap.iban);
      const bic = getValue(colMap.bic);
      const amountStr = getValue(colMap.amount);
      const reference = getValue(colMap.reference) || `REF-${Date.now()}-${i}`;
      const description = getValue(colMap.description);

      if (name && iban && bic && amountStr) {
        const amount = parseFloat(amountStr.replace(/[^\d,.-]/g, '').replace(',', '.'));

        if (amount > 0) {
          payments.push({
            creditorName: name,
            creditorIban: iban,
            creditorBic: bic,
            amount,
            reference,
            remittanceInfo: description || reference
          });
        }
      }
    }

    return payments;
  }
}

export const sepaExportService = new SEPAExportService();
export default sepaExportService;
