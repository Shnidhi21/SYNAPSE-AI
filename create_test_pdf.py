from reportlab.pdfgen import canvas

filename = "SYNAPSE_Test_Incident.pdf"

pdf = canvas.Canvas(filename)

pdf.setFont("Helvetica-Bold", 16)
pdf.drawString(50, 790, "SYNAPSE AI - Investigation Report")

pdf.setFont("Helvetica", 11)

lines = [
    "Company: Nexus Logistics",
    "Incident ID: INC-2026-001",
    "Date: October 25, 2026",
    "Shipment 204 was scheduled to leave Warehouse A at 9:00 AM.",
    "At 8:30 AM, the warehouse server experienced a failure.",
    "Shipment 204 was delayed by approximately four hours.",
    "ABC Corporation reported that its shipment had not arrived.",
    "Initial findings suggest the server failure contributed to the delay."
]

y = 750

for line in lines:
    pdf.drawString(50, y, line)
    y -= 30

pdf.save()

print("Test PDF created successfully")