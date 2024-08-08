const SimplifiedTaxInvoiceTemplate = async data => {
    const { body, AccountingSupplierParty, uuid, organizationIdentifier, PIH, ...val } = await data;

    // console.log("AccountingSupplierParty", AccountingSupplierParty.retailstorestxt)


    const invoiceLineTags = body?.ardocumentdtls?.slice(0, 1)?.map((item, index) => {
        return `
            <cac:InvoiceLine>
            <cbc:ID>${item?.lineid}</cbc:ID>
            <cbc:InvoicedQuantity unitCode="${item?.unitno}">${item?.quantity.toFixed(2)}</cbc:InvoicedQuantity>
            <cbc:LineExtensionAmount currencyID="${body?.currencyno}">${item?.docamount.toFixed(2)}</cbc:LineExtensionAmount>
            <cac:TaxTotal>
                 <cbc:TaxAmount currencyID="${body?.currencyno}">${item?.taxamount.toFixed(2)}</cbc:TaxAmount>
                 <cbc:RoundingAmount currencyID="${body?.currencyno}">${item?.documentamountincludetax.toFixed(2)}</cbc:RoundingAmount>
            </cac:TaxTotal>
            <cac:Item>
                <cbc:Name>itemno</cbc:Name>
                <cac:ClassifiedTaxCategory>
                    <cbc:ID>S</cbc:ID>
                    <cbc:Percent>15</cbc:Percent>
                    <cac:TaxScheme>
                        <cbc:ID>VAT</cbc:ID>
                    </cac:TaxScheme>
                    </cac:ClassifiedTaxCategory>
                    </cac:Item>
                    <cac:Price>
                    <cbc:PriceAmount currencyID="${body?.currencyno}">${item?.unitprice.toFixed(2)}</cbc:PriceAmount>
                    <cac:AllowanceCharge>
                    <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
                    <cbc:AllowanceChargeReason>discount</cbc:AllowanceChargeReason>
                    <cbc:Amount currencyID="${body?.currencyno}">${item?.discountamount.toFixed(2)}</cbc:Amount>
                    </cac:AllowanceCharge>
                    </cac:Price>
                    </cac:InvoiceLine>`;


    });

    return `<?xml version="1.0" encoding="UTF-8"?>
    <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">

        <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
          <cbc:ID>${body?.ardocumentno}</cbc:ID>
        <cbc:UUID>${uuid}</cbc:UUID>
    <cbc:IssueDate>2024-06-30</cbc:IssueDate>
        <cbc:IssueTime>${String(new Date()?.getHours())?.padStart(2, '0')}:${String(new Date()?.getMinutes())?.padStart(
        2,
        '0',
    )}:${String(new Date()?.getSeconds())?.padStart(2, '0')}</cbc:IssueTime>
        <cbc:InvoiceTypeCode name="0200000">388</cbc:InvoiceTypeCode>
       <cbc:Note languageID="en">${body?.documentstxt}</cbc:Note>
        <cbc:DocumentCurrencyCode>${body?.currencyno}</cbc:DocumentCurrencyCode>
        <cbc:TaxCurrencyCode>${body?.currencyno}</cbc:TaxCurrencyCode>
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
        
        <cac:AdditionalDocumentReference>
            <cbc:ID>QR</cbc:ID>
            <cac:Attachment>
                <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">AW/YtNix2YPYqSDYqtmI2LHZitivINin2YTYqtmD2YbZiNmE2YjYrNmK2Kcg2KjYo9mC2LXZiSDYs9ix2LnYqSDYp9mE2YXYrdiv2YjYr9ipIHwgTWF4aW11bSBTcGVlZCBUZWNoIFN1cHBseSBMVEQCDzM5OTk5OTk5OTkwMDAwMwMTMjAyMi0wOC0xN1QxNzo0MTowOAQGMjMxLjE1BQUzMC4xNQYsSHNzMmdORmpCWTVPSm4vNUNFVlpTU05VTXJTZjRRbENNeHdzaW9QTjZmQT0HYE1FVUNJUUNzK0ROUTF2bHo3Sm9vdkE3SlJqYWtuNHRVczBKbENjQW9KTmgvSjY1Rkh3SWdLcHB0MitEZmNMWHRLUTZ5UjQ5dGNWeWRncy9NU1kyeVY5dkFUemNwVXE0PQhYMFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEoWCKa0Sa9FIErTOv0uAkC1VIKXxU9nPpx2vlf4yhMejy8c02XJblDq7tPydo8mq0ahOMmNo8gwni7Xt1KT9UeAlHMEUCIQCxP4nIZp1lwlClG3Gt8nIvKKsGi7xXR1Y0K73iPbqgGwIgPYQuDPI4DAQAz0s5ndrojyQOoCkdyxNN1O+Xqmwv61w=</cbc:EmbeddedDocumentBinaryObject>
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
                    <cbc:RegistrationName>${AccountingSupplierParty.retailstorestxt}</cbc:RegistrationName>
                </cac:PartyLegalEntity>
            </cac:Party>
        </cac:AccountingSupplierParty>
         <cac:AccountingCustomerParty>
        </cac:AccountingCustomerParty>
        <cac:PaymentMeans>
            <cbc:PaymentMeansCode>10</cbc:PaymentMeansCode>
        </cac:PaymentMeans>
        <cac:AllowanceCharge>
             <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
             <cbc:AllowanceChargeReason>discount</cbc:AllowanceChargeReason>
             <cbc:Amount currencyID="${body?.currencyno}">0.00</cbc:Amount>
             <cac:TaxCategory>
                 <cbc:ID schemeID="UN/ECE 5305" schemeAgencyID="6">S</cbc:ID>
                 <cbc:Percent>15</cbc:Percent>
                 <cac:TaxScheme>
                     <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">VAT</cbc:ID>
                 </cac:TaxScheme>
             </cac:TaxCategory>
             <cac:TaxCategory>
                 <cbc:ID schemeID="UN/ECE 5305" schemeAgencyID="6">S</cbc:ID>
                 <cbc:Percent>15</cbc:Percent>
                 <cac:TaxScheme>
                     <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">VAT</cbc:ID>
                 </cac:TaxScheme>
             </cac:TaxCategory>
         </cac:AllowanceCharge>
       <cac:TaxTotal>
             <cbc:TaxAmount currencyID="${body?.currencyno}">${body?.taxdocamount.toFixed(2)}</cbc:TaxAmount>
         </cac:TaxTotal>
         <cac:TaxTotal>
             <cbc:TaxAmount currencyID="${body?.currencyno}">${body?.taxdocamount.toFixed(2)}</cbc:TaxAmount>
             <cac:TaxSubtotal>
                 <cbc:TaxableAmount currencyID="${body?.currencyno}">${body?.netdocamount.toFixed(
        2,
    )}</cbc:TaxableAmount>
                 <cbc:TaxAmount currencyID="${body?.currencyno}">${body?.taxdocamount.toFixed(2)}</cbc:TaxAmount>
                  <cac:TaxCategory>
                      <cbc:ID schemeID="UN/ECE 5305" schemeAgencyID="6">S</cbc:ID>
                      <cbc:Percent>15.00</cbc:Percent>
                     <cac:TaxScheme>
                        <cbc:ID schemeID="UN/ECE 5153" schemeAgencyID="6">VAT</cbc:ID>
                     </cac:TaxScheme>
                  </cac:TaxCategory>
             </cac:TaxSubtotal>
         </cac:TaxTotal>
         
         <cac:LegalMonetaryTotal>
             <cbc:LineExtensionAmount currencyID="${body?.currencyno}">${body?.netdocamount.toFixed(
        2,
    )}</cbc:LineExtensionAmount>
             <cbc:TaxExclusiveAmount currencyID="${body?.currencyno}">${body?.netdocamount.toFixed(
        2,
    )}</cbc:TaxExclusiveAmount>
             <cbc:TaxInclusiveAmount currencyID="${body?.currencyno}">${body?.docamountincludingtax.toFixed(
        2,
    )}</cbc:TaxInclusiveAmount>
             <cbc:AllowanceTotalAmount currencyID="${body?.currencyno}">${body?.discountdocamount.toFixed(
        2,
    )}</cbc:AllowanceTotalAmount>
             <cbc:PrepaidAmount currencyID="${body?.currencyno}">0.00</cbc:PrepaidAmount>
             <cbc:PayableAmount currencyID="${body?.currencyno}">${body.docamountincludingtax.toFixed(
        2,
    )}</cbc:PayableAmount>
         </cac:LegalMonetaryTotal>
        
         ${invoiceLineTags}

         </Invoice>`;
};
module.exports = SimplifiedTaxInvoiceTemplate;


    //   <cbc:IssueDate>
    //       ${new Date()?.getFullYear()}-${String(new Date()?.getMonth() + 1)?.padStart(2, '0')}-$
    //       {String(new Date()?.getDate()).padStart(2, '0')}
    //   </cbc:IssueDate>;