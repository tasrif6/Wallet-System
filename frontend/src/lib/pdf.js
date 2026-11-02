import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

/**
 * Builds and downloads a simple report PDF.
 * NOTE: jsPDF's built-in fonts cannot draw the "৳" sign, so amounts are
 * written as plain numbers and the currency (BDT) goes in the column titles.
 */
export function downloadTablePdf({
  title,
  subtitle,
  summary = [], // [["Label", "Value"], ...]
  head, // [["Col A", "Col B", ...]]
  body, // [["a", "b", ...], ...]
  foot, // optional [["Total", "", "1,000.00", ...]]
  filename,
  rightAlign = [], // column indexes to right-align (numbers)
  orientation = "portrait",
  password, // optional: encrypts the PDF so this password is needed to open it
}) {
  
  // const doc = new jsPDF({ unit: "pt", format: "a4" });
    const doc = new jsPDF({
    unit: "pt",
    format: "a4",
    orientation,
    ...(password && {
      encryption: {
        userPassword: password,
        ownerPassword: password,
        userPermissions: ["print"],
      },
    }),
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, margin, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitle ?? "", margin, 68);
  doc.text(`Generated ${new Date().toLocaleString()}`, margin, 82);
  doc.setTextColor(0);

  let y = 100;
  if (summary.length) {
    autoTable(doc, {
      startY: y,
      body: summary,
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 130 },
      },
      margin: { left: margin, right: margin },
    });
    y = doc.lastAutoTable.finalY + 14;
  }

  const align = {};
  rightAlign.forEach((i) => {
    align[i] = { halign: "right" };
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    foot,
    showFoot: "lastPage",
    theme: "striped",
    headStyles: { fillColor: [29, 78, 216], textColor: 255 },
    footStyles: { fillColor: [241, 245, 249], textColor: 20, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: align,
    margin: { left: margin, right: margin },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Page ${i} of ${pages}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 20,
      { align: "right" },
    );
  }

  doc.save(filename);
}