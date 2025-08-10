/**
 * Formatting Service
 * Converts EN 16931 invoices to specific formats (Factur-X, UBL, CII)
 */

import {
  EN16931Invoice,
  EInvoiceFormat,
  FormattingResult,
  EInvoicingError
} from '@/types/einvoicing.types';
import { createHash } from 'crypto';

export class FormattingService {
  /**
   * Format an EN16931 invoice to the specified format
   */
  async formatDocument(
    invoice: EN16931Invoice,
    format: EInvoiceFormat
  ): Promise<FormattingResult> {
    try {
      console.log(`🔄 Formatting invoice ${invoice.invoice_number} as ${format}`);

      let xmlContent: string;
      let pdfContent: Buffer | undefined;

      switch (format) {
        case 'FACTURX':
          const facturXResult = await this.generateFacturX(invoice);
          xmlContent = facturXResult.xml;
          pdfContent = facturXResult.pdf;
          break;

        case 'UBL':
          xmlContent = await this.generateUBL(invoice);
          break;

        case 'CII':
          xmlContent = await this.generateCII(invoice);
          break;

        default:
          throw new EInvoicingError(`Unsupported format: ${format}`, 'INVALID_FORMAT');
      }

      // Generate hashes
      const sha256_xml = createHash('sha256').update(xmlContent, 'utf8').digest('hex');
      const sha256_pdf = pdfContent 
        ? createHash('sha256').update(pdfContent).digest('hex')
        : undefined;

      return {
        format,
        xml_content: xmlContent,
        pdf_content: pdfContent,
        sha256_xml,
        sha256_pdf,
        metadata: {
          invoice_number: invoice.invoice_number,
          generated_at: new Date().toISOString(),
          format_version: this.getFormatVersion(format)
        }
      };

    } catch (error) {
      console.error('Error formatting document:', error);
      throw new EInvoicingError(
        `Failed to format document as ${format}: ${(error as Error).message}`,
        'FORMATTING_ERROR',
        { format, invoice_number: invoice.invoice_number }
      );
    }
  }

  /**
   * Generate Factur-X document (PDF/A-3 with embedded XML)
   */
  private async generateFacturX(invoice: EN16931Invoice): Promise<{
    xml: string;
    pdf: Buffer;
  }> {
    // Generate CII XML (Factur-X uses UN/CEFACT CII format)
    const xmlContent = await this.generateCII(invoice);

    // Generate PDF with embedded XML
    const pdfContent = await this.generatePDFWithEmbeddedXML(invoice, xmlContent);

    return {
      xml: xmlContent,
      pdf: pdfContent
    };
  }

  /**
   * Generate UBL 2.1 XML
   */
  private async generateUBL(invoice: EN16931Invoice): Promise<string> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${this.escapeXml(invoice.invoice_number)}</cbc:ID>
  <cbc:IssueDate>${invoice.issue_date}</cbc:IssueDate>
  ${invoice.tax_point_date ? `<cbc:TaxPointDate>${invoice.tax_point_date}</cbc:TaxPointDate>` : ''}
  <cbc:InvoiceTypeCode>${invoice.type_code}</cbc:InvoiceTypeCode>
  ${invoice.notes?.map(note => `<cbc:Note>${this.escapeXml(note)}</cbc:Note>`).join('\n  ') || ''}
  <cbc:DocumentCurrencyCode>${invoice.currency_code}</cbc:DocumentCurrencyCode>
  ${invoice.references?.buyer_reference ? `<cbc:BuyerReference>${this.escapeXml(invoice.references.buyer_reference)}</cbc:BuyerReference>` : ''}

  ${this.generateUBLOrderReference(invoice)}
  ${this.generateUBLSupplierParty(invoice.seller)}
  ${this.generateUBLCustomerParty(invoice.buyer)}
  ${this.generateUBLPaymentMeans(invoice.payment_terms)}
  ${this.generateUBLTaxTotal(invoice)}
  ${this.generateUBLMonetaryTotal(invoice.totals)}
  ${invoice.lines.map((line, index) => this.generateUBLInvoiceLine(line, index + 1)).join('\n  ')}

</Invoice>`;

    return this.formatXml(xml);
  }

  /**
   * Generate UN/CEFACT CII XML
   */
  private async generateCII(invoice: EN16931Invoice): Promise<string> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice 
    xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
    xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
    xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1.0.07:basic</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  
  <rsm:ExchangedDocument>
    <ram:ID>${this.escapeXml(invoice.invoice_number)}</ram:ID>
    <ram:TypeCode>${invoice.type_code}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${invoice.issue_date.replace(/-/g, '')}</udt:DateTimeString>
    </ram:IssueDateTime>
    ${invoice.notes?.map(note => `<ram:IncludedNote><ram:Content>${this.escapeXml(note)}</ram:Content></ram:IncludedNote>`).join('\n    ') || ''}
  </rsm:ExchangedDocument>
  
  <rsm:SupplyChainTradeTransaction>
    ${this.generateCIITradeAgreement(invoice)}
    ${this.generateCIITradeDelivery(invoice)}
    ${this.generateCIITradeSettlement(invoice)}
  </rsm:SupplyChainTradeTransaction>
  
</rsm:CrossIndustryInvoice>`;

    return this.formatXml(xml);
  }

  /**
   * Generate PDF with embedded XML (Factur-X)
   */
  private async generatePDFWithEmbeddedXML(
    invoice: EN16931Invoice,
    xmlContent: string
  ): Promise<Buffer> {
    // This is a simplified implementation
    // In production, you would use a proper PDF/A-3 library like pdf-lib
    // with ZUGFeRD/Factur-X embedding capabilities
    
    const pdfHeader = `%PDF-1.7
%âãÏÓ
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
  /Font << /F1 5 0 R >>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 700 Td
(Facture / Invoice: ${invoice.invoice_number}) Tj
0 -20 Td
(Date: ${invoice.issue_date}) Tj
0 -20 Td
(Vendeur: ${invoice.seller.name}) Tj
0 -20 Td
(Acheteur: ${invoice.buyer.name}) Tj
0 -20 Td
(Total: ${invoice.totals.invoice_total_with_vat} ${invoice.currency_code}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000273 00000 n 
0000000524 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
621
%%EOF`;

    // In a real implementation, you would embed the XML as an attachment
    // following the PDF/A-3 and ZUGFeRD specifications
    
    return Buffer.from(pdfHeader, 'utf8');
  }

  // Helper methods for UBL generation
  private generateUBLOrderReference(invoice: EN16931Invoice): string {
    if (!invoice.references?.purchase_order_reference) return '';
    
    return `<cac:OrderReference>
    <cbc:ID>${this.escapeXml(invoice.references.purchase_order_reference)}</cbc:ID>
  </cac:OrderReference>`;
  }

  private generateUBLSupplierParty(seller: EN16931Invoice['seller']): string {
    return `<cac:AccountingSupplierParty>
    <cac:Party>
      ${seller.identifier ? `<cbc:EndpointID schemeID="0088">${this.escapeXml(seller.identifier)}</cbc:EndpointID>` : ''}
      <cac:PartyName>
        <cbc:Name>${this.escapeXml(seller.name)}</cbc:Name>
      </cac:PartyName>
      ${seller.address ? this.generateUBLAddress(seller.address) : ''}
      ${seller.vat_identifier ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${this.escapeXml(seller.vat_identifier)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
      ${seller.legal_registration ? `<cac:PartyLegalEntity>
        <cbc:RegistrationName>${this.escapeXml(seller.name)}</cbc:RegistrationName>
        <cbc:CompanyID schemeID="${seller.legal_registration.scheme_id || '0002'}">${this.escapeXml(seller.legal_registration.id)}</cbc:CompanyID>
      </cac:PartyLegalEntity>` : ''}
      ${seller.contact ? this.generateUBLContact(seller.contact) : ''}
    </cac:Party>
  </cac:AccountingSupplierParty>`;
  }

  private generateUBLCustomerParty(buyer: EN16931Invoice['buyer']): string {
    return `<cac:AccountingCustomerParty>
    <cac:Party>
      ${buyer.identifier ? `<cbc:EndpointID schemeID="0088">${this.escapeXml(buyer.identifier)}</cbc:EndpointID>` : ''}
      <cac:PartyName>
        <cbc:Name>${this.escapeXml(buyer.name)}</cbc:Name>
      </cac:PartyName>
      ${buyer.address ? this.generateUBLAddress(buyer.address) : ''}
      ${buyer.vat_identifier ? `<cac:PartyTaxScheme>
        <cbc:CompanyID>${this.escapeXml(buyer.vat_identifier)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>`;
  }

  private generateUBLAddress(address: EN16931Invoice['seller']['address']): string {
    if (!address) return '';
    
    return `<cac:PostalAddress>
      ${address.street_name ? `<cbc:StreetName>${this.escapeXml(address.street_name)}</cbc:StreetName>` : ''}
      ${address.additional_street_name ? `<cbc:AdditionalStreetName>${this.escapeXml(address.additional_street_name)}</cbc:AdditionalStreetName>` : ''}
      <cbc:CityName>${this.escapeXml(address.city_name)}</cbc:CityName>
      ${address.postal_zone ? `<cbc:PostalZone>${this.escapeXml(address.postal_zone)}</cbc:PostalZone>` : ''}
      ${address.country_subentity ? `<cbc:CountrySubentity>${this.escapeXml(address.country_subentity)}</cbc:CountrySubentity>` : ''}
      <cac:Country>
        <cbc:IdentificationCode>${address.country_code}</cbc:IdentificationCode>
      </cac:Country>
    </cac:PostalAddress>`;
  }

  private generateUBLContact(contact: NonNullable<EN16931Invoice['seller']['contact']>): string {
    return `<cac:Contact>
      ${contact.name ? `<cbc:Name>${this.escapeXml(contact.name)}</cbc:Name>` : ''}
      ${contact.telephone ? `<cbc:Telephone>${this.escapeXml(contact.telephone)}</cbc:Telephone>` : ''}
      ${contact.email ? `<cbc:ElectronicMail>${this.escapeXml(contact.email)}</cbc:ElectronicMail>` : ''}
    </cac:Contact>`;
  }

  private generateUBLPaymentMeans(paymentTerms?: EN16931Invoice['payment_terms']): string {
    if (!paymentTerms?.means) return '';
    
    const means = paymentTerms.means;
    return `<cac:PaymentMeans>
    <cbc:PaymentMeansCode>${means.code}</cbc:PaymentMeansCode>
    ${means.remittance_information ? `<cbc:PaymentID>${this.escapeXml(means.remittance_information)}</cbc:PaymentID>` : ''}
    ${means.creditor_account?.iban ? `<cac:PayeeFinancialAccount>
      <cbc:ID>${this.escapeXml(means.creditor_account.iban)}</cbc:ID>
      ${means.creditor_account.name ? `<cbc:Name>${this.escapeXml(means.creditor_account.name)}</cbc:Name>` : ''}
      ${means.creditor_agent?.bic ? `<cac:FinancialInstitutionBranch>
        <cac:FinancialInstitution>
          <cbc:ID>${this.escapeXml(means.creditor_agent.bic)}</cbc:ID>
        </cac:FinancialInstitution>
      </cac:FinancialInstitutionBranch>` : ''}
    </cac:PayeeFinancialAccount>` : ''}
  </cac:PaymentMeans>`;
  }

  private generateUBLTaxTotal(invoice: EN16931Invoice): string {
    const vatAmount = invoice.totals.invoice_total_vat_amount || 0;
    
    return `<cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoice.currency_code}">${vatAmount.toFixed(2)}</cbc:TaxAmount>
    ${this.generateUBLTaxSubtotals(invoice)}
  </cac:TaxTotal>`;
  }

  private generateUBLTaxSubtotals(invoice: EN16931Invoice): string {
    // Group tax rates
    const taxGroups = new Map<string, { amount: number; baseAmount: number; rate: number; categoryCode: string }>();
    
    invoice.lines.forEach(line => {
      if (line.tax) {
        const key = `${line.tax.category_code}_${line.tax.rate}`;
        const existing = taxGroups.get(key) || { amount: 0, baseAmount: 0, rate: line.tax.rate, categoryCode: line.tax.category_code };
        existing.amount += line.tax.amount || (line.net_amount * line.tax.rate / 100);
        existing.baseAmount += line.net_amount;
        taxGroups.set(key, existing);
      }
    });

    return Array.from(taxGroups.values()).map(tax => `<cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${invoice.currency_code}">${tax.baseAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${invoice.currency_code}">${tax.amount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${tax.categoryCode}</cbc:ID>
        <cbc:Percent>${tax.rate.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`).join('\n    ');
  }

  private generateUBLMonetaryTotal(totals: EN16931Invoice['totals']): string {
    return `<cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">${totals.sum_invoice_line_net_amount.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">${totals.invoice_total_without_vat.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">${totals.invoice_total_with_vat.toFixed(2)}</cbc:TaxInclusiveAmount>
    ${totals.sum_allowances_on_document_level ? `<cbc:AllowanceTotalAmount currencyID="EUR">${totals.sum_allowances_on_document_level.toFixed(2)}</cbc:AllowanceTotalAmount>` : ''}
    ${totals.sum_charges_on_document_level ? `<cbc:ChargeTotalAmount currencyID="EUR">${totals.sum_charges_on_document_level.toFixed(2)}</cbc:ChargeTotalAmount>` : ''}
    <cbc:PayableAmount currencyID="EUR">${totals.amount_due_for_payment.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;
  }

  private generateUBLInvoiceLine(line: EN16931Invoice['lines'][0], lineNumber: number): string {
    return `<cac:InvoiceLine>
    <cbc:ID>${lineNumber}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${line.unit_code}">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">${line.net_amount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${this.escapeXml(line.name)}</cbc:Name>
      ${line.description ? `<cbc:Description>${this.escapeXml(line.description)}</cbc:Description>` : ''}
      ${line.classification_identifier ? `<cac:CommodityClassification>
        <cbc:ItemClassificationCode>${this.escapeXml(line.classification_identifier)}</cbc:ItemClassificationCode>
      </cac:CommodityClassification>` : ''}
      ${line.tax ? `<cac:ClassifiedTaxCategory>
        <cbc:ID>${line.tax.category_code}</cbc:ID>
        <cbc:Percent>${line.tax.rate.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>` : ''}
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">${line.net_price.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
  }

  // Helper methods for CII generation
  private generateCIITradeAgreement(invoice: EN16931Invoice): string {
    return `<ram:ApplicableHeaderTradeAgreement>
      ${invoice.references?.buyer_reference ? `<ram:BuyerReference>${this.escapeXml(invoice.references.buyer_reference)}</ram:BuyerReference>` : ''}
      <ram:SellerTradeParty>
        <ram:Name>${this.escapeXml(invoice.seller.name)}</ram:Name>
        ${this.generateCIITradePartyAddress(invoice.seller.address)}
        ${invoice.seller.vat_identifier ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${this.escapeXml(invoice.seller.vat_identifier)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${this.escapeXml(invoice.buyer.name)}</ram:Name>
        ${this.generateCIITradePartyAddress(invoice.buyer.address)}
        ${invoice.buyer.vat_identifier ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${this.escapeXml(invoice.buyer.vat_identifier)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ''}
      </ram:BuyerTradeParty>
      ${invoice.references?.purchase_order_reference ? `<ram:BuyerOrderReferencedDocument>
        <ram:IssuerAssignedID>${this.escapeXml(invoice.references.purchase_order_reference)}</ram:IssuerAssignedID>
      </ram:BuyerOrderReferencedDocument>` : ''}
    </ram:ApplicableHeaderTradeAgreement>`;
  }

  private generateCIITradePartyAddress(address: EN16931Invoice['seller']['address']): string {
    if (!address) return '';
    
    return `<ram:PostalTradeAddress>
      ${address.postal_zone ? `<ram:PostcodeCode>${this.escapeXml(address.postal_zone)}</ram:PostcodeCode>` : ''}
      ${address.street_name ? `<ram:LineOne>${this.escapeXml(address.street_name)}</ram:LineOne>` : ''}
      <ram:CityName>${this.escapeXml(address.city_name)}</ram:CityName>
      <ram:CountryID>${address.country_code}</ram:CountryID>
    </ram:PostalTradeAddress>`;
  }

  private generateCIITradeDelivery(invoice: EN16931Invoice): string {
    return `<ram:ApplicableHeaderTradeDelivery>
      ${invoice.tax_point_date ? `<ram:ActualDeliverySupplyChainEvent>
        <ram:OccurrenceDateTime>
          <udt:DateTimeString format="102">${invoice.tax_point_date.replace(/-/g, '')}</udt:DateTimeString>
        </ram:OccurrenceDateTime>
      </ram:ActualDeliverySupplyChainEvent>` : ''}
    </ram:ApplicableHeaderTradeDelivery>`;
  }

  private generateCIITradeSettlement(invoice: EN16931Invoice): string {
    return `<ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${invoice.currency_code}</ram:InvoiceCurrencyCode>
      ${this.generateCIIPaymentTerms(invoice.payment_terms)}
      ${this.generateCIITaxes(invoice)}
      ${this.generateCIIMonetarySummation(invoice.totals)}
      ${invoice.lines.map(line => this.generateCIITradeLineItem(line)).join('\n      ')}
    </ram:ApplicableHeaderTradeSettlement>`;
  }

  private generateCIIPaymentTerms(paymentTerms?: EN16931Invoice['payment_terms']): string {
    if (!paymentTerms) return '';
    
    return `${paymentTerms.due_date ? `<ram:SpecifiedTradePaymentTerms>
      <ram:DueDateDateTime>
        <udt:DateTimeString format="102">${paymentTerms.due_date.replace(/-/g, '')}</udt:DateTimeString>
      </ram:DueDateDateTime>
      ${paymentTerms.description ? `<ram:Description>${this.escapeXml(paymentTerms.description)}</ram:Description>` : ''}
    </ram:SpecifiedTradePaymentTerms>` : ''}
    ${paymentTerms.means ? `<ram:SpecifiedTradeSettlementPaymentMeans>
      <ram:TypeCode>${paymentTerms.means.code}</ram:TypeCode>
      ${paymentTerms.means.remittance_information ? `<ram:Information>${this.escapeXml(paymentTerms.means.remittance_information)}</ram:Information>` : ''}
      ${paymentTerms.means.creditor_account?.iban ? `<ram:PayeePartyCreditorFinancialAccount>
        <ram:IBANID>${this.escapeXml(paymentTerms.means.creditor_account.iban)}</ram:IBANID>
        ${paymentTerms.means.creditor_account.name ? `<ram:AccountName>${this.escapeXml(paymentTerms.means.creditor_account.name)}</ram:AccountName>` : ''}
      </ram:PayeePartyCreditorFinancialAccount>` : ''}
    </ram:SpecifiedTradeSettlementPaymentMeans>` : ''}`;
  }

  private generateCIITaxes(invoice: EN16931Invoice): string {
    // Group tax rates (similar to UBL)
    const taxGroups = new Map<string, { amount: number; baseAmount: number; rate: number; categoryCode: string }>();
    
    invoice.lines.forEach(line => {
      if (line.tax) {
        const key = `${line.tax.category_code}_${line.tax.rate}`;
        const existing = taxGroups.get(key) || { amount: 0, baseAmount: 0, rate: line.tax.rate, categoryCode: line.tax.category_code };
        existing.amount += line.tax.amount || (line.net_amount * line.tax.rate / 100);
        existing.baseAmount += line.net_amount;
        taxGroups.set(key, existing);
      }
    });

    return Array.from(taxGroups.values()).map(tax => `<ram:ApplicableTradeTax>
      <ram:CalculatedAmount>${tax.amount.toFixed(2)}</ram:CalculatedAmount>
      <ram:TypeCode>VAT</ram:TypeCode>
      <ram:BasisAmount>${tax.baseAmount.toFixed(2)}</ram:BasisAmount>
      <ram:CategoryCode>${tax.categoryCode}</ram:CategoryCode>
      <ram:RateApplicablePercent>${tax.rate.toFixed(2)}</ram:RateApplicablePercent>
    </ram:ApplicableTradeTax>`).join('\n      ');
  }

  private generateCIIMonetarySummation(totals: EN16931Invoice['totals']): string {
    return `<ram:SpecifiedTradeSettlementHeaderMonetarySummation>
      <ram:LineTotalAmount>${totals.sum_invoice_line_net_amount.toFixed(2)}</ram:LineTotalAmount>
      <ram:TaxBasisTotalAmount>${totals.invoice_total_without_vat.toFixed(2)}</ram:TaxBasisTotalAmount>
      <ram:TaxTotalAmount currencyID="EUR">${(totals.invoice_total_vat_amount || 0).toFixed(2)}</ram:TaxTotalAmount>
      <ram:GrandTotalAmount>${totals.invoice_total_with_vat.toFixed(2)}</ram:GrandTotalAmount>
      <ram:DuePayableAmount>${totals.amount_due_for_payment.toFixed(2)}</ram:DuePayableAmount>
    </ram:SpecifiedTradeSettlementHeaderMonetarySummation>`;
  }

  private generateCIITradeLineItem(line: EN16931Invoice['lines'][0]): string {
    return `<ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${line.id}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${this.escapeXml(line.name)}</ram:Name>
        ${line.description ? `<ram:Description>${this.escapeXml(line.description)}</ram:Description>` : ''}
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${line.net_price.toFixed(2)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="${line.unit_code}">${line.quantity}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        ${line.tax ? `<ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${line.tax.category_code}</ram:CategoryCode>
          <ram:RateApplicablePercent>${line.tax.rate.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>` : ''}
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${line.net_amount.toFixed(2)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`;
  }

  // Utility methods
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private formatXml(xml: string): string {
    // Basic XML formatting (in production, use a proper XML formatter)
    return xml.replace(/>\s+</g, '><').trim();
  }

  private getFormatVersion(format: EInvoiceFormat): string {
    switch (format) {
      case 'FACTURX': return '1.0.7';
      case 'UBL': return '2.1';
      case 'CII': return 'D16B';
      default: return '1.0';
    }
  }
}