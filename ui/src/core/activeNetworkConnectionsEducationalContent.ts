import type {
  ProcedureLearnMoreContent,
  ProcedureSideAnnotation,
} from "./procedurePresentation";

export type ActiveNetworkConnectionsProcedureEducation = {
  technicalLineIds: Readonly<Record<number, string>>;
  annotations: readonly ProcedureSideAnnotation[];
  learnMore: ProcedureLearnMoreContent;
};

export const ACTIVE_NETWORK_CONNECTIONS_EDUCATIONAL_CONTENT:
  Readonly<Record<number, ActiveNetworkConnectionsProcedureEducation>> = {
    1: {
      technicalLineIds: {},
      annotations: [],
      learnMore: {
        howToExecute:
          "Confirm the employee's identity using the organization's approved verification procedure. Verify the affected workstation and the application identified in the support ticket.",
        whatItDoesAndHow:
          "Identity verification establishes that the technician is assisting the correct employee and investigating the appropriate organizational workstation.",
        whyThisMatters:
          "Verification reduces the risk of unauthorized access and troubleshooting activity involving the wrong user or device.",
      },
    },
    2: {
      technicalLineIds: {
        0: "active-connections-p02-app",
        2: "active-connections-p02-error",
        4: "active-connections-p02-service",
        6: "active-connections-p02-socket-error",
        8: "active-connections-p02-unsuccessful",
      },
      annotations: [
        {
          id: "active-connections-p02-socket",
          targetLineId: "active-connections-p02-socket-error",
          content: "Socket: A communication endpoint used by an application.",
        },
        {
          id: "active-connections-p02-wsaeaddrinuse",
          targetLineId: "active-connections-p02-socket-error",
          content:
            "Socket error 10048: Windows Sockets error WSAEADDRINUSE, indicating that a requested socket address is already in use.",
        },
        {
          id: "active-connections-p02-local-service",
          targetLineId: "active-connections-p02-service",
          content:
            "Local reporting service: An application component that provides reporting functionality through a local communication endpoint.",
        },
      ],
      learnMore: {
        howToExecute:
          "Open the Windows Start menu, search for Company Reporting Tool and launch the application. Observe the startup behavior and record the displayed error.",
        whatItDoesAndHow:
          "Reproducing the reported failure establishes the application's current behavior. Windows Sockets error 10048 indicates that an attempted socket binding could not be completed because the requested address is already in use.\n\nThe error does not independently identify the affected endpoint or its owning process.",
        whyThisMatters:
          "The error provides evidence of a socket binding failure and narrows the investigation to the application's network requirements.",
      },
    },
    3: {
      technicalLineIds: {
        0: "active-connections-p03-file",
        2: "active-connections-p03-section",
        3: "active-connections-p03-protocol",
        4: "active-connections-p03-address",
        5: "active-connections-p03-port",
      },
      annotations: [
        {
          id: "active-connections-p03-ini",
          targetLineId: "active-connections-p03-file",
          content:
            "INI file: A text-based configuration format organized into sections and key-value pairs.",
        },
        {
          id: "active-connections-p03-local-service",
          targetLineId: "active-connections-p03-section",
          content: "LocalService: The application-specific configuration section.",
        },
        {
          id: "active-connections-p03-protocol",
          targetLineId: "active-connections-p03-protocol",
          content: "Protocol: The communication protocol configured for the service.",
        },
        {
          id: "active-connections-p03-tcp",
          targetLineId: "active-connections-p03-protocol",
          content:
            "TCP: Transmission Control Protocol, a connection-oriented transport protocol.",
        },
        {
          id: "active-connections-p03-listen-address",
          targetLineId: "active-connections-p03-address",
          content:
            "ListenAddress: The local IP address on which the service is configured to listen.",
        },
        {
          id: "active-connections-p03-loopback",
          targetLineId: "active-connections-p03-address",
          content:
            "127.0.0.1: The standard IPv4 loopback address used for communication within the same computer.",
        },
        {
          id: "active-connections-p03-listen-port",
          targetLineId: "active-connections-p03-port",
          content: "ListenPort: The local TCP port configured for the service.",
        },
        {
          id: "active-connections-p03-port-example",
          targetLineId: "active-connections-p03-port",
          content: "8080: The application-specific port used in this scenario.",
        },
      ],
      learnMore: {
        howToExecute:
          "Press Windows + E to open File Explorer. Enter C:\\CompanyTools\\Reporting in the address bar and press Enter.\n\nLocate config.ini, right-click the file and select Open with > Notepad.\n\nInspect the LocalService section without modifying or saving the file.",
        whatItDoesAndHow:
          "Notepad displays the contents of a plain-text configuration file without requiring specialized configuration software.\n\nThe INI file identifies the protocol, local address and port configured for the application's reporting service.",
        whyThisMatters:
          "Configuration inspection establishes the application's actual network requirements rather than relying on assumptions about its default settings.",
      },
    },
    4: {
      technicalLineIds: {
        0: "active-connections-p04-command",
        1: "active-connections-p04-listener",
      },
      annotations: [
        {
          id: "active-connections-p04-netstat",
          targetLineId: "active-connections-p04-command",
          content: "netstat: Displays network connections and listening endpoints.",
        },
        {
          id: "active-connections-p04-a-switch",
          targetLineId: "active-connections-p04-command",
          content: "-a: Includes active connections and listening endpoints.",
        },
        {
          id: "active-connections-p04-n-switch",
          targetLineId: "active-connections-p04-command",
          content: "-n: Displays numerical addresses and port numbers.",
        },
        {
          id: "active-connections-p04-o-switch",
          targetLineId: "active-connections-p04-command",
          content: "-o: Displays the owning process ID.",
        },
        {
          id: "active-connections-p04-pipe",
          targetLineId: "active-connections-p04-command",
          content: "|: Pipes the output of one command into another command.",
        },
        {
          id: "active-connections-p04-findstr",
          targetLineId: "active-connections-p04-command",
          content: "findstr: Searches text for matching patterns.",
        },
        {
          id: "active-connections-p04-filter",
          targetLineId: "active-connections-p04-command",
          content: ":8080: The scenario-specific text search pattern.",
        },
        {
          id: "active-connections-p04-tcp",
          targetLineId: "active-connections-p04-listener",
          content: "TCP: The transport protocol associated with the socket.",
        },
        {
          id: "active-connections-p04-local-endpoint",
          targetLineId: "active-connections-p04-listener",
          content: "127.0.0.1:8080: The local IP address and port.",
        },
        {
          id: "active-connections-p04-foreign-endpoint",
          targetLineId: "active-connections-p04-listener",
          content:
            "0.0.0.0:0: No specific remote endpoint is associated with this listening socket.",
        },
        {
          id: "active-connections-p04-listening",
          targetLineId: "active-connections-p04-listener",
          content:
            "LISTENING: The socket is waiting for incoming connection requests.",
        },
        {
          id: "active-connections-p04-pid",
          targetLineId: "active-connections-p04-listener",
          content: "4820: The process ID associated with this listener.",
        },
      ],
      learnMore: {
        howToExecute:
          "Press Windows + R, type cmd and press Enter.\n\nEnter:\n\nnetstat -ano | findstr :8080\n\nPress Enter.\n\nInspect the returned protocol, local address, foreign address, connection state and process ID.\n\nConfirm that the matching entry represents a local TCP listener on 127.0.0.1:8080.",
        whatItDoesAndHow:
          "Command Prompt is appropriate because netstat and findstr are native Windows command-line utilities that can be combined using a pipe.\n\nNetstat displays network socket information. Findstr filters that information to lines containing the specified text.\n\nThe text filter may also match remote endpoints or longer port numbers. The returned address, port and state must therefore be interpreted together.",
        whyThisMatters:
          "The output establishes that the required local endpoint is already occupied and provides the process identifier associated with that listener.",
      },
    },
    5: {
      technicalLineIds: {
        0: "active-connections-p05-command",
        2: "active-connections-p05-image-header",
        3: "active-connections-p05-divider",
        4: "active-connections-p05-process",
      },
      annotations: [
        {
          id: "active-connections-p05-tasklist",
          targetLineId: "active-connections-p05-command",
          content: "tasklist: Displays information about running Windows processes.",
        },
        {
          id: "active-connections-p05-filter-switch",
          targetLineId: "active-connections-p05-command",
          content: "/FI: Applies a filter to the process list.",
        },
        {
          id: "active-connections-p05-pid-filter",
          targetLineId: "active-connections-p05-command",
          content: "PID: Process identification number assigned by Windows.",
        },
        {
          id: "active-connections-p05-eq-filter",
          targetLineId: "active-connections-p05-command",
          content: "eq: Equality operator used by the filter.",
        },
        {
          id: "active-connections-p05-image-name",
          targetLineId: "active-connections-p05-image-header",
          content: "Image Name: The executable name associated with the process.",
        },
        {
          id: "active-connections-p05-executable",
          targetLineId: "active-connections-p05-process",
          content:
            "ReportPreview.exe: The executable file associated with the Report Preview Tool application.",
        },
        {
          id: "active-connections-p05-process-id",
          targetLineId: "active-connections-p05-process",
          content: "4820: The process ID discovered during the current investigation.",
        },
        {
          id: "active-connections-p05-console",
          targetLineId: "active-connections-p05-process",
          content:
            "Console: The local interactive Windows session associated with the running process.",
        },
        {
          id: "active-connections-p05-session-name",
          targetLineId: "active-connections-p05-image-header",
          content: "Session Name: The Windows session associated with the process.",
        },
        {
          id: "active-connections-p05-session-number",
          targetLineId: "active-connections-p05-image-header",
          content: "Session#: The numerical session identifier.",
        },
        {
          id: "active-connections-p05-memory-usage",
          targetLineId: "active-connections-p05-image-header",
          content: "Mem Usage: The process memory usage reported by tasklist.",
        },
      ],
      learnMore: {
        howToExecute:
          'In Command Prompt, enter:\n\ntasklist /FI "PID eq 4820"\n\nPress Enter.\n\nInspect the Image Name and PID columns.',
        whatItDoesAndHow:
          "Tasklist retrieves information about running Windows processes. The filter restricts the displayed results to the specified process ID.\n\nA PID identifies a particular running process instance, while the image name identifies its executable.",
        whyThisMatters:
          "Associating a network listener with its owning executable establishes which running process is responsible for the occupied endpoint.",
      },
    },
    6: {
      technicalLineIds: {},
      annotations: [],
      learnMore: {
        howToExecute:
          "Locate the existing Report Preview Tool window using the Windows taskbar.\n\nInspect the application's current activity and confirm with the employee that no unsaved work or active operations remain.\n\nConfirm that closing the application is authorized.",
        whatItDoesAndHow:
          "Application inspection establishes the operational status of the identified process. A running application may continue processing information even when its window is minimized.",
        whyThisMatters:
          "Establishing operational status and authorization reduces the risk of interrupting business activities or losing unsaved information.",
      },
    },
    7: {
      technicalLineIds: {},
      annotations: [],
      learnMore: {
        howToExecute:
          "Return to the Report Preview Tool window and select its Close button.\n\nAllow the application to complete its normal shutdown procedure.\n\nDo not forcibly terminate the process.",
        whatItDoesAndHow:
          "Normal application shutdown allows an application to complete pending operations and release resources associated with its terminating processes, including network sockets.",
        whyThisMatters:
          "Graceful shutdown minimizes the risk of data loss or interruption while allowing the application to release its resources.",
      },
    },
    8: {
      technicalLineIds: {
        0: "active-connections-p08-command",
        2: "active-connections-p08-prompt",
      },
      annotations: [
        {
          id: "active-connections-p08-empty-output",
          targetLineId: "active-connections-p08-command",
          content:
            "Empty output: No network entries matched the specified text at the time of execution.",
        },
        {
          id: "active-connections-p08-prompt-returned",
          targetLineId: "active-connections-p08-prompt",
          content:
            "Returned command prompt: The command has completed without displaying matching entries.",
        },
        {
          id: "active-connections-p08-current-state",
          targetLineId: "active-connections-p08-command",
          content:
            "Network connection information represents the system state at the time of inspection.",
        },
      ],
      learnMore: {
        howToExecute:
          "Return to Command Prompt and enter:\n\nnetstat -ano | findstr :8080\n\nPress Enter.\n\nInspect the results and confirm that the previously identified listener is absent.",
        whatItDoesAndHow:
          "Repeating the command retrieves updated network socket information using the same search pattern as the initial investigation.\n\nAn empty result indicates that no matching entries were returned during the current inspection.",
        whyThisMatters:
          "Comparing the current evidence against the original network information establishes whether the previously identified listener remains present.",
      },
    },
    9: {
      technicalLineIds: {
        0: "active-connections-p09-app",
        2: "active-connections-p09-initialized",
        4: "active-connections-p09-status",
      },
      annotations: [
        {
          id: "active-connections-p09-initialized",
          targetLineId: "active-connections-p09-initialized",
          content:
            "Initialized: The application component reports successful startup.",
        },
        {
          id: "active-connections-p09-ready",
          targetLineId: "active-connections-p09-status",
          content:
            "Ready: The application reports that its initialization process has completed.",
        },
      ],
      learnMore: {
        howToExecute:
          "Open the Windows Start menu, search for Company Reporting Tool and launch the application. Observe the startup behavior and confirm whether the previous error appears.",
        whatItDoesAndHow:
          "Launching the application initiates its configured startup operations, including initialization of its local reporting service.\n\nThe application reports whether those initialization operations completed successfully.",
        whyThisMatters:
          "Repeating the original operation after corrective action establishes whether the reported startup failure remains reproducible.",
      },
    },
    10: {
      technicalLineIds: {
        0: "active-connections-p10-command",
        1: "active-connections-p10-listener",
      },
      annotations: [
        {
          id: "active-connections-p10-tcp",
          targetLineId: "active-connections-p10-listener",
          content: "TCP: The transport protocol associated with the socket.",
        },
        {
          id: "active-connections-p10-local-endpoint",
          targetLineId: "active-connections-p10-listener",
          content: "127.0.0.1:8080: The local endpoint associated with the current listener.",
        },
        {
          id: "active-connections-p10-foreign-endpoint",
          targetLineId: "active-connections-p10-listener",
          content:
            "0.0.0.0:0: No specific remote endpoint is associated with this listening socket.",
        },
        {
          id: "active-connections-p10-listening",
          targetLineId: "active-connections-p10-listener",
          content:
            "LISTENING: The socket is waiting for incoming connection requests.",
        },
        {
          id: "active-connections-p10-pid",
          targetLineId: "active-connections-p10-listener",
          content: "6132: The process ID associated with the current listener.",
        },
        {
          id: "active-connections-p10-dynamic-pid",
          targetLineId: "active-connections-p10-listener",
          content:
            "Process IDs are assigned dynamically by Windows. This numerical value is specific to the scenario.",
        },
      ],
      learnMore: {
        howToExecute:
          "Return to Command Prompt and enter:\n\nnetstat -ano | findstr :8080\n\nPress Enter.\n\nInspect the protocol, local address, connection state and current process ID.",
        whatItDoesAndHow:
          "Netstat retrieves updated network socket information. The returned entry establishes that a listening socket is present on the specified endpoint and identifies its current process ID.",
        whyThisMatters:
          "A listening socket confirms that a process has established the specified network endpoint. It does not independently establish application ownership or functionality.",
      },
    },
    11: {
      technicalLineIds: {
        0: "active-connections-p11-command",
        2: "active-connections-p11-image-header",
        3: "active-connections-p11-divider",
        4: "active-connections-p11-process",
      },
      annotations: [
        {
          id: "active-connections-p11-image-name",
          targetLineId: "active-connections-p11-process",
          content:
            "ReportingTool.exe: The executable associated with the Company Reporting Tool.",
        },
        {
          id: "active-connections-p11-process-id",
          targetLineId: "active-connections-p11-process",
          content: "PID 6132: The process ID discovered during the current network inspection.",
        },
        {
          id: "active-connections-p11-image-header",
          targetLineId: "active-connections-p11-image-header",
          content: "Image Name: The executable name associated with the running process.",
        },
        {
          id: "active-connections-p11-console",
          targetLineId: "active-connections-p11-process",
          content: "Console: The local interactive Windows session.",
        },
        {
          id: "active-connections-p11-memory-usage",
          targetLineId: "active-connections-p11-image-header",
          content: "Mem Usage: The process memory usage reported by tasklist.",
        },
      ],
      learnMore: {
        howToExecute:
          'In Command Prompt, enter:\n\ntasklist /FI "PID eq 6132"\n\nPress Enter.\n\nInspect the returned Image Name and PID. Confirm that the executable is ReportingTool.exe.',
        whatItDoesAndHow:
          "Tasklist associates the process identifier with its running executable.\n\nCombined with the network socket information already collected, the result establishes the process associated with the required listening endpoint.",
        whyThisMatters:
          "Process ownership verification distinguishes the intended application from another process that could be using the same endpoint.",
      },
    },
    12: {
      technicalLineIds: {
        0: "active-connections-p12-app",
        2: "active-connections-p12-report",
        4: "active-connections-p12-generation",
        6: "active-connections-p12-status",
      },
      annotations: [
        {
          id: "active-connections-p12-sample-report",
          targetLineId: "active-connections-p12-report",
          content: "Sample Report: The scenario-specific test operation.",
        },
        {
          id: "active-connections-p12-generation-status",
          targetLineId: "active-connections-p12-generation",
          content:
            "Generation status: The result reported by the application's reporting function.",
        },
        {
          id: "active-connections-p12-completed",
          targetLineId: "active-connections-p12-generation",
          content: "Completed: The reporting operation finished successfully.",
        },
      ],
      learnMore: {
        howToExecute:
          "Return to the Company Reporting Tool window.\n\nSelect Sample Report and then select Generate Report.\n\nConfirm that the report is generated and displayed successfully.",
        whatItDoesAndHow:
          "Functional testing exercises the application's intended business operation rather than relying exclusively on its startup status or network socket information.",
        whyThisMatters:
          "Successful initialization and network endpoint ownership do not independently establish that the application's business functions operate correctly.",
      },
    },
    13: {
      technicalLineIds: {},
      annotations: [],
      learnMore: {
        howToExecute:
          "Ask the employee to use the Company Reporting Tool and confirm that normal reporting activities can be performed successfully.",
        whatItDoesAndHow:
          "User verification establishes that the restored application functionality satisfies the employee's original operational requirement.",
        whyThisMatters:
          "Successful troubleshooting requires restoration of the affected business function, not solely correction of technical indicators.",
      },
    },
  };