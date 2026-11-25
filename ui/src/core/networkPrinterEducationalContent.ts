import type { ProcedureLearnMoreContent, ProcedureSideAnnotation } from "./procedurePresentation";

export type NetworkPrinterEducation = {
  technicalLineIds: Readonly<Record<number, string>>;
  annotations: readonly ProcedureSideAnnotation[];
  learnMore: ProcedureLearnMoreContent;
};

export const NETWORK_PRINTER_EDUCATIONAL_CONTENT: Readonly<Record<number, NetworkPrinterEducation>> = {
  1: {
    technicalLineIds: { 0: "printer-p01-verification", 1: "printer-p01-status" },
    annotations: [
      { id: "printer-p01-verification", targetLineId: "printer-p01-verification", content: "Identity Verification: Successful — The approved identity verification process has been completed." },
      { id: "printer-p01-status", targetLineId: "printer-p01-status", content: "User Status: Verified — The user's identity has been confirmed according to organizational policy." },
    ],
    learnMore: {
      howToExecute: "Follow the organization's approved identity verification process.",
      whatItDoesAndHow: "Confirms that the person requesting support is the authorized employee.",
      whyThisMatters: "Protects organizational resources and ensures support is provided to the appropriate user.",
    },
  },
  2: {
    technicalLineIds: { 0: "printer-p02-printer", 1: "printer-p02-document", 2: "printer-p02-request", 3: "printer-p02-output" },
    annotations: [
      { id: "printer-p02-printer", targetLineId: "printer-p02-printer", content: "Printer — Identifies the selected printer." },
      { id: "printer-p02-document", targetLineId: "printer-p02-document", content: "Document — Identifies the example document submitted for testing." },
      { id: "printer-p02-request", targetLineId: "printer-p02-request", content: "Print Request: Submitted — Windows received the print request." },
      { id: "printer-p02-output", targetLineId: "printer-p02-output", content: "Physical Print Output: Not produced — The requested document did not print." },
    ],
    learnMore: {
      howToExecute: "Open a document, select Print, choose the Office Printer, and submit the print job.",
      whatItDoesAndHow: "Reproduces the reported printing problem under controlled conditions.",
      whyThisMatters: "Confirms that the reported issue exists before troubleshooting begins.",
    },
  },
  3: {
    technicalLineIds: { 0: "printer-p03-power", 1: "printer-p03-ethernet", 2: "printer-p03-link" },
    annotations: [
      { id: "printer-p03-power", targetLineId: "printer-p03-power", content: "Power: On — Confirms the printer has electrical power." },
      { id: "printer-p03-ethernet", targetLineId: "printer-p03-ethernet", content: "Ethernet: Connected — Confirms the physical network cable is connected." },
      { id: "printer-p03-link", targetLineId: "printer-p03-link", content: "Network Link: Active — Indicates an established physical network link, but does not guarantee IP connectivity." },
    ],
    learnMore: {
      howToExecute: "Inspect the printer's power indicator, Ethernet cable, and network link indicator.",
      whatItDoesAndHow: "Checks the printer's basic physical operating conditions.",
      whyThisMatters: "Physical connectivity problems should be investigated before more advanced network diagnostics.",
    },
  },
  4: {
    technicalLineIds: { 0: "printer-p04-printer", 1: "printer-p04-status" },
    annotations: [
      { id: "printer-p04-offline", targetLineId: "printer-p04-status", content: "Offline — Windows currently considers the printer unavailable." },
    ],
    learnMore: {
      howToExecute: "Press Windows + I to open Windows Settings. Select Bluetooth & devices, then Printers & scanners. Locate and select the Office Printer. Inspect the printer's reported status and determine whether Windows identifies it as available or offline.",
      whatItDoesAndHow: "Displays the printer's current availability as reported by Windows.",
      whyThisMatters: "A powered-on printer can still appear offline when Windows cannot communicate with it.",
    },
  },
  5: {
    technicalLineIds: { 0: "printer-p05-printer", 1: "printer-p05-document", 2: "printer-p05-status", 3: "printer-p05-pending" },
    annotations: [
      { id: "printer-p05-error", targetLineId: "printer-p05-status", content: "Error - Printing — Windows encountered a problem processing the print job." },
      { id: "printer-p05-pending", targetLineId: "printer-p05-pending", content: "Pending Jobs: 1 — One document remains queued for printing." },
    ],
    learnMore: {
      howToExecute: "Press Windows + I to open Settings. Navigate to Bluetooth & devices > Printers & scanners. Select the Office Printer and choose Open print queue. Inspect the submitted document, its current status, and the number of pending print jobs.",
      whatItDoesAndHow: "Displays documents waiting to be processed by the printer.",
      whyThisMatters: "Helps determine whether print jobs are reaching the Windows printing system and whether they are being completed.",
    },
  },
  6: {
    technicalLineIds: { 0: "printer-p06-connection", 1: "printer-p06-ipv4", 2: "printer-p06-subnet", 3: "printer-p06-gateway" },
    annotations: [
      { id: "printer-p06-ethernet", targetLineId: "printer-p06-connection", content: "Ethernet — The printer uses a wired network connection." },
      { id: "printer-p06-ip", targetLineId: "printer-p06-ipv4", content: "IPv4 Address — The printer's current network address." },
      { id: "printer-p06-mask", targetLineId: "printer-p06-subnet", content: "Subnet Mask — Identifies the network and host portions of the IPv4 address." },
      { id: "printer-p06-gw", targetLineId: "printer-p06-gateway", content: "Default Gateway — Provides access to destinations outside the local subnet." },
    ],
    learnMore: {
      howToExecute: "Open the printer's network settings using its control panel, or print its network configuration report.",
      whatItDoesAndHow: "Retrieves the network settings currently assigned to the printer.",
      whyThisMatters: "Establishes the printer's actual network address using information obtained directly from the device. These IP addresses are scenario-specific examples, not universal printer or network settings.",
    },
  },
  7: {
    technicalLineIds: { 0: "printer-p07-printer", 1: "printer-p07-type", 2: "printer-p07-configured-ip", 3: "printer-p07-actual-ip", 4: "printer-p07-match" },
    annotations: [
      { id: "printer-p07-standard-port", targetLineId: "printer-p07-type", content: "Standard TCP/IP Port — Allows Windows to communicate with a network printer using its configured network address." },
      { id: "printer-p07-configured", targetLineId: "printer-p07-configured-ip", content: "Configured IP Address — The destination Windows is attempting to communicate with." },
      { id: "printer-p07-actual", targetLineId: "printer-p07-actual-ip", content: "Actual Printer IP Address — The address discovered directly from the printer." },
      { id: "printer-p07-mismatch", targetLineId: "printer-p07-match", content: "Configuration Match: No — The configured destination does not match the printer's actual address." },
    ],
    learnMore: {
      howToExecute: "Open Windows Settings and navigate to Bluetooth & devices > Printers & scanners. Select the Office Printer and open Printer properties. Select the Ports tab and identify the currently selected Standard TCP/IP Port. Select Configure Port to inspect the configured Printer Name or IP Address field. Do not change the configuration during this inspection.",
      whatItDoesAndHow: "Identifies the network destination Windows uses when communicating with the printer.",
      whyThisMatters: "An incorrect destination address can prevent Windows from communicating with an otherwise operational printer.",
    },
  },
  8: {
    technicalLineIds: { 0: "printer-p08-version", 1: "printer-p08-copyright", 3: "printer-p08-prompt" },
    annotations: [
      { id: "printer-p08-ready", targetLineId: "printer-p08-prompt", content: "C:\\Users\\Technician> — The command prompt is ready to accept input." },
    ],
    learnMore: {
      howToExecute: "Press Windows + R, type cmd, and press Enter.",
      whatItDoesAndHow: "Opens the Windows command-line interface.",
      whyThisMatters: "Provides access to diagnostic commands that can test network communication.",
    },
  },
  9: {
    technicalLineIds: { 0: "printer-p09-command", 2: "printer-p09-target", 3: "printer-p09-reply1", 4: "printer-p09-reply2", 5: "printer-p09-reply3", 6: "printer-p09-reply4", 8: "printer-p09-stats", 10: "printer-p09-loss", 12: "printer-p09-summary", 13: "printer-p09-times" },
    annotations: [
      { id: "printer-p09-target-note", targetLineId: "printer-p09-target", content: "Pinging 192.168.1.60 — Identifies the destination being tested." },
      { id: "printer-p09-reply-note", targetLineId: "printer-p09-reply1", content: "Reply from — Indicates that an ICMP Echo Reply was received." },
      { id: "printer-p09-bytes", targetLineId: "printer-p09-reply1", content: "bytes=32 — The size of the ICMP data payload." },
      { id: "printer-p09-time", targetLineId: "printer-p09-reply1", content: "time — The round-trip response time." },
      { id: "printer-p09-ttl", targetLineId: "printer-p09-reply1", content: "TTL — The remaining Time to Live value in the received packet." },
      { id: "printer-p09-loss-note", targetLineId: "printer-p09-loss", content: "0% loss — All four requests received replies." },
      { id: "printer-p09-roundtrip", targetLineId: "printer-p09-summary", content: "Round trip times — Summarizes the measured response times." },
    ],
    learnMore: {
      howToExecute: "Enter ping 192.168.1.60 in Command Prompt and press Enter.",
      whatItDoesAndHow: "Ping sends ICMP Echo Requests to the specified IP address and measures the responses.",
      whyThisMatters: "Confirms that the printer's actual IP address is reachable from the workstation. A successful ping does not independently prove that printing services are functioning.",
    },
  },
  10: {
    technicalLineIds: { 0: "printer-p10-previous-ip", 1: "printer-p10-updated-ip", 2: "printer-p10-match" },
    annotations: [
      { id: "printer-p10-previous", targetLineId: "printer-p10-previous-ip", content: "Previous IP Address — The incorrect destination previously configured in Windows." },
      { id: "printer-p10-updated", targetLineId: "printer-p10-updated-ip", content: "Updated IP Address — The corrected destination matching the printer." },
      { id: "printer-p10-match-note", targetLineId: "printer-p10-match", content: "Configuration Match: Yes — Windows is now configured to use the printer's actual address." },
    ],
    learnMore: {
      howToExecute: "Open Windows Settings and navigate to Bluetooth & devices > Printers & scanners. Select the Office Printer and open Printer properties. Select the Ports tab, highlight the existing Standard TCP/IP Port, and select Configure Port. Change the Printer Name or IP Address field to 192.168.1.60. Select OK to save the port configuration and Apply or OK to save the printer properties using authorized permissions.",
      whatItDoesAndHow: "Corrects the network destination used by Windows to communicate with the printer.",
      whyThisMatters: "Resolves the identified configuration mismatch without unnecessarily modifying the printer's network settings.",
    },
  },
  11: {
    technicalLineIds: { 0: "printer-p11-printer", 1: "printer-p11-pending", 2: "printer-p11-document", 3: "printer-p11-output" },
    annotations: [
      { id: "printer-p11-pending-note", targetLineId: "printer-p11-pending", content: "Pending Jobs: 0 — No documents remain waiting in the print queue." },
      { id: "printer-p11-output-note", targetLineId: "printer-p11-output", content: "Physical Print Output: Confirmed — The technician observed the previously queued document print successfully." },
    ],
    learnMore: {
      howToExecute: "Open Windows Settings and navigate to Bluetooth & devices > Printers & scanners. Select the Office Printer and choose Open print queue. Verify that the previously submitted document has completed and inspect the remaining number of pending jobs. Confirm that the original document was physically printed.",
      whatItDoesAndHow: "Checks whether the previously unsuccessful print job has completed after the configuration correction.",
      whyThisMatters: "Provides evidence that the original printing problem has been resolved. An empty queue alone does not guarantee successful physical printing.",
    },
  },
  12: {
    technicalLineIds: { 0: "printer-p12-printer", 1: "printer-p12-output" },
    annotations: [
      { id: "printer-p12-output-note", targetLineId: "printer-p12-output", content: "Printed Successfully — The test page was physically produced by the printer." },
    ],
    learnMore: {
      howToExecute: "Open Windows Settings and navigate to Bluetooth & devices > Printers & scanners. Select the Office Printer and open Printer properties. On the General tab, select Print Test Page. Confirm that the printer physically produces the Windows test page.",
      whatItDoesAndHow: "Submits a standardized Windows test print job.",
      whyThisMatters: "Verifies that the workstation can successfully submit and complete a new print job.",
    },
  },
  13: {
    technicalLineIds: { 0: "printer-p13-user-response" },
    annotations: [
      { id: "printer-p13-user-response-note", targetLineId: "printer-p13-user-response", content: "User Response — The user confirms that documents print successfully and the original issue is resolved." },
    ],
    learnMore: {
      howToExecute: "Ask the user to print a document using their normal workflow and confirm that it prints successfully.",
      whatItDoesAndHow: "Verifies that the user's original printing functionality has been restored.",
      whyThisMatters: "Technical verification and user confirmation establish that the reported issue has been resolved.",
    },
  },
};
