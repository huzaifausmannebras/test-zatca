const SimplifiedCreditTemplate = async data => {
    const { body, AccountingSupplierParty, uuid, organizationIdentifier, PIH, organization, ...val } = await data;
    console.log('organization arhi', organization);
    console.log('AccountingSupplierParty', AccountingSupplierParty);

    const invoiceLineTags = body?.ardocumentdtls?.slice(0, 1)?.map((item, index) => {
        return `<cac:InvoiceLine>
        <cbc:ID>${item?.lineid}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="${item?.unitno}">${item?.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${body?.currencyno}">${item?.docamount}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
             <cbc:TaxAmount currencyID="${body?.currencyno}">${item?.taxamount}</cbc:TaxAmount>
             <cbc:RoundingAmount currencyID="${body?.currencyno}">${item?.documentamountincludetax}</cbc:RoundingAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${item?.itemno}</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>Z</cbc:ID>
                <cbc:Percent>0</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${body?.currencyno}">${item?.unitprice}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>${body?.ardocumentno}</cbc:ID>
    <cbc:UUID>${uuid}</cbc:UUID>
    <cbc:IssueDate>2024-06-30</cbc:IssueDate>
    <cbc:IssueTime>${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(
        2,
        '0',
    )}:${String(new Date().getSeconds()).padStart(2, '0')}</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="0211010">383</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${body?.currencyno}</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>${body?.currencyno}</cbc:TaxCurrencyCode>
    <cac:BillingReference>
      <cac:InvoiceDocumentReference>
         <cbc:ID>Invoice Number: 354; Invoice Issue Date: 2021-02-10</cbc:ID>
      </cac:InvoiceDocumentReference>
   </cac:BillingReference>

    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>${body?.counter}</cbc:UUID>
    </cac:AdditionalDocumentReference>
   
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${PIH}</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>

    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="CRN">1010010000</cbc:ID>
            </cac:PartyIdentification>
            <cac:PostalAddress>
                <cbc:StreetName>School District</cbc:StreetName>
                <cbc:BuildingNumber>4633</cbc:BuildingNumber>
                <cbc:CitySubdivisionName>Al-Baghdadiya Al-Gharbiyya</cbc:CitySubdivisionName>
                <cbc:CityName>Jeddah</cbc:CityName>
                <cbc:PostalZone>22235</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${organizationIdentifier}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${AccountingSupplierParty?.retailstorestxt}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
       <cac:AccountingCustomerParty>
       </cac:AccountingCustomerParty>
    <cac:Delivery>
        <cbc:ActualDeliveryDate>2024-06-30</cbc:ActualDeliveryDate>
        <cbc:LatestDeliveryDate>2024-06-30</cbc:LatestDeliveryDate>
        </cac:Delivery>
    <cac:PaymentMeans>
        <cbc:PaymentMeansCode>42</cbc:PaymentMeansCode>
      <cbc:InstructionNote>CANCELLATION_OR_TERMINATION</cbc:InstructionNote>
        </cac:PaymentMeans>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${body?.currencyno}">${body?.taxdocamount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="${body?.currencyno}">${body?.netdocamount?.toFixed(2)}</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="${body?.currencyno}">${body?.taxdocamount?.toFixed(2)}</cbc:TaxAmount>
          <cac:TaxCategory>
            <cbc:ID>Z</cbc:ID>
            <cbc:Percent>0</cbc:Percent>
            <cbc:TaxExemptionReasonCode>VATEX-SA-HEA </cbc:TaxExemptionReasonCode>
            <cbc:TaxExemptionReason>Private healthcare to citizen</cbc:TaxExemptionReason>
            <cac:TaxScheme>
               <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
         </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
     <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${body?.currencyno}">${body?.taxdocamount.toFixed(2)}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="SAR">${body?.netdocamount?.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="SAR">${body?.netdocamount?.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">${body?.docamountincludingtax.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="SAR">${body.docamountincludingtax?.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    ${invoiceLineTags}
</Invoice>`;
};
module.exports = SimplifiedCreditTemplate;

//   <cbc:IssueDate>
//       ${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-$
//       {String(new Date().getDate()).padStart(2, '0')}
//   </cbc:IssueDate>;
// <cbc:ActualDeliveryDate>${body?.postdate?.split('T')[0]}</cbc:ActualDeliveryDate>
