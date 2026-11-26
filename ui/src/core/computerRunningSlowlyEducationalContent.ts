import type {
  ProcedureLearnMoreContent,
  ProcedureSideAnnotation,
} from "./procedurePresentation";

export type ComputerRunningSlowlyProcedureEducation = {
  technicalLineIds: Readonly<Record<number, string>>;
  annotations: readonly ProcedureSideAnnotation[];
  learnMore: ProcedureLearnMoreContent;
};

export const COMPUTER_RUNNING_SLOWLY_EDUCATIONAL_CONTENT:
  Readonly<Record<number, ComputerRunningSlowlyProcedureEducation>> = {
    1: {
      technicalLineIds: {},
      annotations: [],
      learnMore: {
        howToExecute:
          "1. Ask the employee to provide the identifying information required by the organization's support policy.\n2. Compare the supplied information with the organization's employee records.\n3. Confirm the affected workstation and support authorization.",
        whatItDoesAndHow:
          "Identity verification establishes that the support request is associated with the correct employee and workstation.\n\nOrganizations use verification procedures to protect employee information, company equipment and access to technical support services.",
        whyThisMatters:
          "Verifying identity helps prevent unauthorized access and ensures troubleshooting is performed on the correct equipment.",
      },
    },
    2: {
      technicalLineIds: {
        0: "computer-slow-p02-workstation",
        1: "computer-slow-p02-os",
        3: "computer-slow-p02-observed",
        5: "computer-slow-p02-switching",
        6: "computer-slow-p02-explorer",
        7: "computer-slow-p02-freezing",
        8: "computer-slow-p02-operational",
      },
      annotations: [
        {
          id: "computer-slow-p02-responsiveness",
          targetLineId: "computer-slow-p02-explorer",
          content:
            "Responsiveness: How quickly a computer reacts to user input or completes an requested interaction.",
        },
        {
          id: "computer-slow-p02-intermittent",
          targetLineId: "computer-slow-p02-freezing",
          content:
            "Intermittent: A condition that occurs periodically rather than continuously.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Ask the employee to demonstrate the reported problem.\n2. Switch between the applications normally used by the employee.\n3. Open File Explorer and navigate through accessible folders.\n4. Observe delays, freezing and general responsiveness.\n5. Confirm whether the reported behavior can be reproduced.",
        whatItDoesAndHow:
          "A functional performance check evaluates how the workstation behaves during normal use.\n\nA computer may remain operational while experiencing delays caused by resource limitations, software problems or other conditions.\n\nReproducing the symptoms establishes that the reported problem is observable.",
        whyThisMatters:
          "Confirming the original symptoms creates a baseline for troubleshooting.\n\nThe technician can later compare workstation behavior against this initial observation to determine whether corrective actions improved performance.",
      },
    },
    3: {
      technicalLineIds: {
        0: "computer-slow-p03-restart",
        1: "computer-slow-p03-signin",
        2: "computer-slow-p03-desktop",
        3: "computer-slow-p03-startup-apps",
      },
      annotations: [
        {
          id: "computer-slow-p03-restart",
          targetLineId: "computer-slow-p03-restart",
          content: "Restart: Shuts down the current operating system session and starts Windows again.",
        },
        {
          id: "computer-slow-p03-startup-apps",
          targetLineId: "computer-slow-p03-startup-apps",
          content:
            "Startup applications: Programs configured to launch automatically when Windows starts or an employee signs in.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Ask the employee to save open documents and other work.\n2. Obtain authorization to restart the workstation.\n3. Open the Windows Start menu.\n4. Select Power.\n5. Select Restart.\n6. Allow Windows to restart.\n7. Have the employee sign in.\n8. Confirm that the desktop and normal startup applications load.",
        whatItDoesAndHow:
          "Restarting Windows ends running processes and starts a new operating system session.\n\nMemory allocated to terminated processes is released, and applications begin running again with newly initialized process states.\n\nApplications configured to start automatically may launch again after sign-in.",
        whyThisMatters:
          "Restarting is a common basic troubleshooting action that can clear temporary software conditions and accumulated resource usage.\n\nHowever, a successful restart does not establish that an underlying recurring problem has been corrected.",
      },
    },
    4: {
      technicalLineIds: {
        0: "computer-slow-p04-heading",
        2: "computer-slow-p04-immediate-heading",
        4: "computer-slow-p04-immediate-app-switching",
        5: "computer-slow-p04-immediate-explorer",
        6: "computer-slow-p04-immediate-freezing",
        8: "computer-slow-p04-delayed-heading",
        10: "computer-slow-p04-delayed-app-switching",
        11: "computer-slow-p04-delayed-explorer",
        12: "computer-slow-p04-delayed-freezing",
      },
      annotations: [
        {
          id: "computer-slow-p04-temporary-improvement",
          targetLineId: "computer-slow-p04-immediate-heading",
          content:
            "Temporary improvement: A reduction in symptoms that does not necessarily indicate correction of the underlying cause.",
        },
        {
          id: "computer-slow-p04-recurring-issue",
          targetLineId: "computer-slow-p04-delayed-freezing",
          content:
            "Recurring issue: A problem that returns after initially improving or disappearing.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Repeat the original application switching and File Explorer checks.\n2. Allow the employee's normal applications and background activities to operate.\n3. Observe workstation behavior over approximately 10 minutes.\n4. Repeat the original performance checks.\n5. Compare the results with the initial observations.",
        whatItDoesAndHow:
          "Retesting determines whether a troubleshooting action produced lasting improvement or only temporary symptom relief.\n\nSome software conditions develop gradually as applications continue running or processing information.\n\nA workstation can therefore perform normally immediately after restarting and experience reduced performance later.",
        whyThisMatters:
          "The return of the original symptoms demonstrates that restarting did not resolve the underlying issue.\n\nObserving the recurrence prevents the technician from prematurely closing the support ticket.",
      },
    },
    5: {
      technicalLineIds: {
        0: "computer-slow-p05-this-pc",
        1: "computer-slow-p05-local-disk",
        2: "computer-slow-p05-total",
        3: "computer-slow-p05-used",
        4: "computer-slow-p05-free",
      },
      annotations: [
        {
          id: "computer-slow-p05-local-disk",
          targetLineId: "computer-slow-p05-local-disk",
          content: "Local Disk (C:): The drive letter commonly assigned to the Windows system volume.",
        },
        {
          id: "computer-slow-p05-total-capacity",
          targetLineId: "computer-slow-p05-total",
          content: "Total capacity: The total storage space available on the displayed volume.",
        },
        {
          id: "computer-slow-p05-used-space",
          targetLineId: "computer-slow-p05-used",
          content: "Used space: Storage currently occupied by Windows, applications and files.",
        },
        {
          id: "computer-slow-p05-free-space",
          targetLineId: "computer-slow-p05-free",
          content: "Free space: Storage capacity currently available for additional data.",
        },
        {
          id: "computer-slow-p05-gb",
          targetLineId: "computer-slow-p05-total",
          content: "GB: Gigabyte, a unit used to describe digital storage capacity.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Press Windows + E to open File Explorer.\n2. Select This PC.\n3. Locate Local Disk (C:) under Devices and drives.\n4. Review the displayed available and total storage capacity.\n5. If additional information is needed, right-click the drive and select Properties.",
        whatItDoesAndHow:
          "Storage capacity describes how much information a storage device or volume can hold.\n\nUsed space represents occupied storage. Free space represents storage available for additional files and system operations.\n\nAn SSD stores persistent information using flash memory.\n\nStorage capacity is different from disk active time. A drive may have substantial free space while remaining busy processing read and write operations.",
        whyThisMatters:
          "Insufficient storage can interfere with normal application and operating system activity.\n\nChecking available capacity helps establish whether storage exhaustion is contributing to the reported performance problem.\n\nThe available storage displayed in this scenario does not indicate a nearly full system drive.",
      },
    },
    6: {
      technicalLineIds: {
        0: "computer-slow-p06-task-manager-performance",
        2: "computer-slow-p06-cpu-heading",
        3: "computer-slow-p06-cpu-utilization",
        4: "computer-slow-p06-memory-heading",
        5: "computer-slow-p06-installed-memory",
        6: "computer-slow-p06-memory-in-use",
        7: "computer-slow-p06-memory-available",
        8: "computer-slow-p06-memory-utilization",
        9: "computer-slow-p06-disk-heading",
        10: "computer-slow-p06-disk-type",
        11: "computer-slow-p06-disk-active-time",
        12: "computer-slow-p06-gpu-heading",
        13: "computer-slow-p06-gpu-utilization",
        15: "computer-slow-p06-task-manager-processes",
        17: "computer-slow-p06-process-column-headings",
        19: "computer-slow-p06-company-sync-process",
        20: "computer-slow-p06-browser-process",
        21: "computer-slow-p06-explorer-process",
        22: "computer-slow-p06-other-processes",
      },
      annotations: [
        {
          id: "computer-slow-p06-cpu",
          targetLineId: "computer-slow-p06-cpu-heading",
          content: "CPU: Central Processing Unit. Executes instructions and performs general computing operations.",
        },
        {
          id: "computer-slow-p06-cpu-utilization",
          targetLineId: "computer-slow-p06-cpu-utilization",
          content: "CPU utilization: The proportion of available processor activity currently being used.",
        },
        {
          id: "computer-slow-p06-ram",
          targetLineId: "computer-slow-p06-memory-heading",
          content: "RAM: Random Access Memory. Temporary working memory used by Windows and running applications.",
        },
        {
          id: "computer-slow-p06-installed-memory",
          targetLineId: "computer-slow-p06-installed-memory",
          content: "Installed memory: The physical RAM installed in the workstation.",
        },
        {
          id: "computer-slow-p06-in-use",
          targetLineId: "computer-slow-p06-memory-in-use",
          content: "In use: Physical memory currently being used by the operating system, applications and related system activity.",
        },
        {
          id: "computer-slow-p06-available",
          targetLineId: "computer-slow-p06-memory-available",
          content: "Available memory: Memory Windows can make available to applications without first paging out active memory contents.",
        },
        {
          id: "computer-slow-p06-memory-utilization",
          targetLineId: "computer-slow-p06-memory-utilization",
          content: "Memory utilization: The proportion of usable physical memory currently in use.",
        },
        {
          id: "computer-slow-p06-ssd",
          targetLineId: "computer-slow-p06-disk-type",
          content:
            "SSD: Solid-State Drive. A storage device that uses flash memory rather than mechanical moving parts.",
        },
        {
          id: "computer-slow-p06-disk-active-time",
          targetLineId: "computer-slow-p06-disk-active-time",
          content: "Disk active time: The proportion of the measurement interval during which the storage device is servicing requests.",
        },
        {
          id: "computer-slow-p06-gpu",
          targetLineId: "computer-slow-p06-gpu-heading",
          content: "GPU: Graphics Processing Unit. Processes graphics and other supported computational workloads.",
        },
        {
          id: "computer-slow-p06-process",
          targetLineId: "computer-slow-p06-company-sync-process",
          content: "Process: A running instance of a program with its own execution state and allocated resources.",
        },
        {
          id: "computer-slow-p06-background-process",
          targetLineId: "computer-slow-p06-task-manager-processes",
          content: "Background process: A running program or component that may operate without a visible application window.",
        },
        {
          id: "computer-slow-p06-mb",
          targetLineId: "computer-slow-p06-company-sync-process",
          content: "MB: Megabyte, a unit used to describe digital information or memory consumption.",
        },
        {
          id: "computer-slow-p06-resource-bottleneck",
          targetLineId: "computer-slow-p06-memory-utilization",
          content: "Resource bottleneck: A resource limitation that restricts overall system performance.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Press Ctrl + Shift + Esc to open Task Manager.\n2. Select Performance.\n3. Inspect CPU utilization.\n4. Select Memory and inspect installed, in-use and available memory.\n5. Select Disk and inspect active time.\n6. Select GPU and inspect utilization.\n7. Open Processes.\n8. Select the Memory column to sort processes by memory consumption.\n9. Review the processes consuming the most memory.\n10. Inspect the CPU and Disk columns as needed to compare resource activity.",
        whatItDoesAndHow:
          "Task Manager displays running processes and system resource utilization.\n\nThe CPU executes instructions. RAM holds information required by active programs. Storage retains information and services read and write requests. The GPU performs graphics-related and other supported workloads.\n\nResource utilization changes as applications and Windows perform work.\n\nA process consuming substantial memory can contribute to reduced available RAM. Elevated disk active time indicates that the storage device is busy, not necessarily that its storage capacity is full.\n\nThe displayed measurements are scenario-specific observations, not universal failure thresholds.\n\nA single high-memory observation does not establish that an application has a memory leak.",
        whyThisMatters:
          "Task Manager helps technicians identify which resources are experiencing pressure and which processes are consuming those resources.\n\nComparing several resource measurements prevents the technician from assuming that every slow computer has a processor, storage or hardware problem.",
      },
    },
    7: {
      technicalLineIds: {
        0: "computer-slow-p07-memory-heading",
        2: "computer-slow-p07-process",
        3: "computer-slow-p07-private-memory",
        4: "computer-slow-p07-working-set",
        5: "computer-slow-p07-process-hard-faults",
        6: "computer-slow-p07-system-hard-faults",
        8: "computer-slow-p07-disk-heading",
        10: "computer-slow-p07-disk-image",
        11: "computer-slow-p07-pagefile",
        12: "computer-slow-p07-pagefile-read",
        13: "computer-slow-p07-pagefile-write",
        15: "computer-slow-p07-observation-heading",
        19: "computer-slow-p07-observation-header",
        20: "computer-slow-p07-memory-start",
        21: "computer-slow-p07-memory-two-minutes",
        22: "computer-slow-p07-memory-five-minutes",
        24: "computer-slow-p07-observation-note",
      },
      annotations: [
        {
          id: "computer-slow-p07-executable",
          targetLineId: "computer-slow-p07-process",
          content: "CompanySync.exe: The executable associated with the fictional Company Sync Tool application.",
        },
        {
          id: "computer-slow-p07-private-memory",
          targetLineId: "computer-slow-p07-private-memory",
          content: "Private (KB): The portion of a process's working set that is resident in physical RAM and cannot be shared with other processes.",
        },
        {
          id: "computer-slow-p07-working-set",
          targetLineId: "computer-slow-p07-working-set",
          content: "Working Set (KB): The total portion of a process's memory currently resident in physical RAM, including private and shareable memory.",
        },
        {
          id: "computer-slow-p07-virtual-memory",
          targetLineId: "computer-slow-p07-memory-heading",
          content: "Virtual memory: The memory-management system that provides processes with virtual address spaces and manages their relationship to physical memory and backing storage.",
        },
        {
          id: "computer-slow-p07-pagefile",
          targetLineId: "computer-slow-p07-pagefile",
          content: "Pagefile: A Windows-managed file that can provide backing storage for committed memory and support memory management.",
        },
        {
          id: "computer-slow-p07-paging",
          targetLineId: "computer-slow-p07-pagefile",
          content: "Paging: The movement or retrieval of memory pages between physical memory and backing storage when required.",
        },
        {
          id: "computer-slow-p07-hard-fault",
          targetLineId: "computer-slow-p07-process-hard-faults",
          content: "Hard fault: An event occurring when a requested memory page is not currently resident in physical RAM and must be retrieved from backing storage.",
        },
        {
          id: "computer-slow-p07-hard-fault-rate",
          targetLineId: "computer-slow-p07-process-hard-faults",
          content: "Hard faults/sec: The number of hard faults occurring per second. A hard fault does not necessarily indicate a hardware failure or pagefile access specifically.",
        },
        {
          id: "computer-slow-p07-bytes-rate",
          targetLineId: "computer-slow-p07-pagefile-read",
          content: "B/sec: Bytes per second, a measurement of data transfer rate.",
        },
        {
          id: "computer-slow-p07-memory-leak",
          targetLineId: "computer-slow-p07-memory-five-minutes",
          content: "Memory leak: A software condition in which allocated memory is not properly released when it is no longer needed.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Press Windows + R.\n2. Enter resmon.exe.\n3. Press Enter.\n4. Select the Memory tab.\n5. Locate CompanySync.exe.\n6. Review Private (KB), Working Set (KB) and Hard Faults/sec.\n7. Select the Disk tab.\n8. Expand Disk Activity.\n9. Inspect activity associated with C:\\pagefile.sys.\n10. Return to the Memory tab.\n11. Allow the normal synchronization workload to continue.\n12. Record the process's Private (KB) measurement at the beginning, after two minutes and after five minutes. Convert the recorded values to MB for comparison by dividing by 1,024.\n13. Compare the recorded measurements.",
        whatItDoesAndHow:
          "Resource Monitor provides more detailed information about process activity and resource usage.\n\nWindows uses virtual memory to manage the memory requirements of running processes.\n\nWhen requested memory pages are not resident in RAM, Windows may need to retrieve them from backing storage. This produces hard faults.\n\nHard faults may involve the paging file or other file-backed memory. They are not automatically evidence of defective hardware.\n\nThe observed pagefile activity provides additional evidence that paging is occurring.\n\nA memory leak can cause a process's allocated memory to grow when memory is not properly released.\n\nRepeated measurements under a consistent workload can help identify abnormal memory growth. Growth alone does not conclusively prove a software defect because legitimate application activity can also increase memory usage.",
        whyThisMatters:
          "Detailed resource inspection helps distinguish ordinary memory consumption from sustained memory pressure and unusual process behavior.\n\nCombining process memory measurements with paging-file activity provides stronger evidence than relying on one Task Manager percentage.\n\nRecording measurements over time establishes a baseline for evaluating subsequent changes.",
      },
    },
    8: {
      technicalLineIds: {
        0: "computer-slow-p08-about-heading",
        2: "computer-slow-p08-installed-version",
        4: "computer-slow-p08-kb-heading",
        6: "computer-slow-p08-article",
        7: "computer-slow-p08-title",
        8: "computer-slow-p08-affected-version",
        10: "computer-slow-p08-symptoms-heading",
        12: "computer-slow-p08-symptom-memory",
        13: "computer-slow-p08-symptom-available",
        14: "computer-slow-p08-symptom-paging",
        15: "computer-slow-p08-symptom-responsiveness",
        16: "computer-slow-p08-symptom-restart",
        18: "computer-slow-p08-cause-heading",
        20: "computer-slow-p08-cause",
        22: "computer-slow-p08-corrected-version",
        23: "computer-slow-p08-installer-source",
        24: "computer-slow-p08-authorization",
        25: "computer-slow-p08-requirement",
      },
      annotations: [
        {
          id: "computer-slow-p08-application-version",
          targetLineId: "computer-slow-p08-installed-version",
          content: "Application version: An identifier representing a particular software release.",
        },
        {
          id: "computer-slow-p08-knowledge-base",
          targetLineId: "computer-slow-p08-kb-heading",
          content: "Knowledge Base: An organized collection of support documentation, known issues and approved troubleshooting procedures.",
        },
        {
          id: "computer-slow-p08-known-issue",
          targetLineId: "computer-slow-p08-article",
          content: "Known issue: A documented software or hardware problem recognized by the responsible support organization or vendor.",
        },
        {
          id: "computer-slow-p08-corrective-update",
          targetLineId: "computer-slow-p08-corrected-version",
          content: "Corrective update: A software release containing changes intended to address a documented defect.",
        },
        {
          id: "computer-slow-p08-managed-repository",
          targetLineId: "computer-slow-p08-installer-source",
          content: "Managed Software Repository: An organization-approved source for authorized software packages.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Open Company Sync Tool.\n2. Open Help and select About.\n3. Record the installed application version.\n4. Open the organization's IT Knowledge Base.\n5. Search for Company Sync Tool performance or memory issues.\n6. Locate KB-206.\n7. Review the documented symptoms and affected version.\n8. Compare the documented conditions with the workstation's observed behavior.\n9. Review the corrected version, installation authorization and documented requirements.",
        whatItDoesAndHow:
          "Application version information identifies the software release installed on a workstation.\n\nKnowledge Base articles document recognized problems, affected versions and organization-approved resolutions.\n\nComparing observed technical evidence with documented conditions helps determine whether a known defect applies to the current workstation.\n\nThe application name, version numbers and KB article in this scenario are fictional organizational examples.",
        whyThisMatters:
          "Reviewing approved support documentation helps technicians avoid unnecessary hardware replacement, unsupported configuration changes and speculative corrective actions.\n\nMatching the observed symptoms and installed version with a documented defect provides a supported basis for corrective work.",
      },
    },
    9: {
      technicalLineIds: {
        0: "computer-slow-p09-app-heading",
        1: "computer-slow-p09-sync-status",
        2: "computer-slow-p09-pending-operations",
        3: "computer-slow-p09-authorization",
        4: "computer-slow-p09-app-status",
        6: "computer-slow-p09-task-manager-heading",
        7: "computer-slow-p09-process-status",
      },
      annotations: [
        {
          id: "computer-slow-p09-synchronization",
          targetLineId: "computer-slow-p09-sync-status",
          content: "Synchronization: The process of keeping information consistent between supported locations or systems.",
        },
        {
          id: "computer-slow-p09-pending-operation",
          targetLineId: "computer-slow-p09-pending-operations",
          content: "Pending operation: An application task that has not yet completed.",
        },
        {
          id: "computer-slow-p09-graceful-closure",
          targetLineId: "computer-slow-p09-app-status",
          content: "Graceful closure: Closing an application through its normal exit mechanism so it can complete its shutdown operations.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Open Company Sync Tool.\n2. Review its synchronization status.\n3. Allow active synchronization operations to complete.\n4. Confirm that closing the application will not interrupt unsaved employee work.\n5. Obtain employee authorization.\n6. Use the application's Exit command.\n7. Open Task Manager.\n8. Confirm that CompanySync.exe is no longer running.",
        whatItDoesAndHow:
          "Graceful application closure allows the program to finish supported shutdown operations and release its allocated resources.\n\nSome applications continue running in the background after their main window is closed.\n\nChecking the process list confirms whether the associated executable has actually stopped running.",
        whyThisMatters:
          "Closing software safely helps prevent interrupted operations and potential data loss.\n\nConfirming that the application has exited also establishes that its executable is no longer actively using files or resources required during normal operation.",
      },
    },
    10: {
      technicalLineIds: {
        0: "computer-slow-p10-repository-heading",
        1: "computer-slow-p10-package",
        2: "computer-slow-p10-approval",
        4: "computer-slow-p10-installation-heading",
        6: "computer-slow-p10-previous-version",
        7: "computer-slow-p10-target-version",
        8: "computer-slow-p10-installation-status",
        9: "computer-slow-p10-restart-required",
      },
      annotations: [
        {
          id: "computer-slow-p10-package",
          targetLineId: "computer-slow-p10-package",
          content: "Software package: A collection of files and installation information used to install or update software.",
        },
        {
          id: "computer-slow-p10-installer",
          targetLineId: "computer-slow-p10-installation-status",
          content: "Installer: Software responsible for applying the required application files and installation changes.",
        },
        {
          id: "computer-slow-p10-target-version",
          targetLineId: "computer-slow-p10-target-version",
          content: "Target version: The software release the installation is intended to install.",
        },
        {
          id: "computer-slow-p10-restart-required",
          targetLineId: "computer-slow-p10-restart-required",
          content: "Restart required: An installation condition indicating whether Windows must restart to complete the changes.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Open the organization's managed software repository.\n2. Locate the approved Company Sync Tool 2.4.2 package.\n3. Confirm the package name and version.\n4. Confirm the package is approved for the workstation.\n5. Launch the approved installer.\n6. Follow the organization's authorized installation process.\n7. Review the installation result.\n8. Check whether the installer requires a workstation restart.",
        whatItDoesAndHow:
          "A software update replaces or modifies application components to install a newer release.\n\nCorrective updates may contain changes that address documented defects, improve stability or resolve compatibility problems.\n\nThe organization's managed software repository provides an approved distribution source.\n\nA successful installation indicates that the installer completed its operations. It does not independently establish that the original performance issue has been resolved.",
        whyThisMatters:
          "Using an approved software package helps ensure that the technician applies the supported correction rather than installing unauthorized or incompatible software.\n\nReviewing the installation result establishes whether the corrective installation completed successfully.",
      },
    },
    11: {
      technicalLineIds: {
        0: "computer-slow-p11-about-heading",
        1: "computer-slow-p11-application",
        2: "computer-slow-p11-installed-version",
        3: "computer-slow-p11-application-status",
        4: "computer-slow-p11-sync-status",
      },
      annotations: [
        {
          id: "computer-slow-p11-installed-version",
          targetLineId: "computer-slow-p11-installed-version",
          content: "Installed version: The software release currently present on the workstation.",
        },
        {
          id: "computer-slow-p11-initialization",
          targetLineId: "computer-slow-p11-application-status",
          content: "Initialization: The process of preparing an application and its required components for operation.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Launch Company Sync Tool.\n2. Confirm that the application opens successfully.\n3. Open Help.\n4. Select About.\n5. Compare the displayed version with the approved corrected version.\n6. Confirm that the application's normal functionality is available.",
        whatItDoesAndHow:
          "Post-installation verification checks whether the expected application release is present and capable of starting.\n\nAn installer may report success even though additional application-level verification is still necessary.\n\nThe application's own version information provides evidence of the release currently installed.",
        whyThisMatters:
          "Verifying the installed version prevents the technician from assuming that the intended update was applied solely because an installer reported success.\n\nSuccessful application startup also helps establish that the updated software remains operational.",
      },
    },
    12: {
      technicalLineIds: {
        0: "computer-slow-p12-task-manager-heading",
        2: "computer-slow-p12-cpu-heading",
        3: "computer-slow-p12-cpu-utilization",
        4: "computer-slow-p12-memory-heading",
        5: "computer-slow-p12-installed-memory",
        6: "computer-slow-p12-memory-in-use",
        7: "computer-slow-p12-memory-available",
        8: "computer-slow-p12-memory-utilization",
        9: "computer-slow-p12-disk-heading",
        10: "computer-slow-p12-disk-type",
        11: "computer-slow-p12-disk-active-time",
        12: "computer-slow-p12-gpu-heading",
        13: "computer-slow-p12-gpu-utilization",
        15: "computer-slow-p12-process-heading",
        17: "computer-slow-p12-company-sync",
        21: "computer-slow-p12-resource-monitor-memory-heading",
        23: "computer-slow-p12-resource-monitor-process",
        24: "computer-slow-p12-private-memory",
        25: "computer-slow-p12-working-set",
        26: "computer-slow-p12-process-hard-faults",
        27: "computer-slow-p12-system-hard-faults",
        29: "computer-slow-p12-disk-activity-heading",
        31: "computer-slow-p12-disk-image",
        32: "computer-slow-p12-pagefile",
        33: "computer-slow-p12-pagefile-read",
        34: "computer-slow-p12-pagefile-write",
        36: "computer-slow-p12-observation-heading",
        38: "computer-slow-p12-equivalent-workload",
        40: "computer-slow-p12-observation-header",
        41: "computer-slow-p12-observation-start",
        42: "computer-slow-p12-observation-two-minutes",
        43: "computer-slow-p12-observation-five-minutes",
        45: "computer-slow-p12-comparison-heading",
        47: "computer-slow-p12-comparison-header",
        48: "computer-slow-p12-comparison-memory-utilization",
        49: "computer-slow-p12-comparison-available-memory",
        50: "computer-slow-p12-comparison-disk-active-time",
        51: "computer-slow-p12-comparison-process-growth",
        52: "computer-slow-p12-comparison-hard-faults",
      },
      annotations: [
        {
          id: "computer-slow-p12-baseline",
          targetLineId: "computer-slow-p12-comparison-heading",
          content: "Baseline: Previously recorded measurements used as a reference for comparison.",
        },
        {
          id: "computer-slow-p12-comparable-workload",
          targetLineId: "computer-slow-p12-equivalent-workload",
          content: "Comparable workload: Performing equivalent application activities when comparing system behavior.",
        },
        {
          id: "computer-slow-p12-stable-memory",
          targetLineId: "computer-slow-p12-observation-five-minutes",
          content: "Stable memory consumption: Memory usage that remains within a reasonably consistent range during the observed activity.",
        },
        {
          id: "computer-slow-p12-post-correction",
          targetLineId: "computer-slow-p12-comparison-process-growth",
          content: "Post-correction verification: Inspecting technical conditions after a corrective action to determine whether the relevant problem indicators have improved.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Allow Company Sync Tool to perform the same normal synchronization workload used during the original investigation.\n2. Press Ctrl + Shift + Esc to open Task Manager.\n3. Inspect CPU, Memory, Disk and GPU utilization.\n4. Open Processes and inspect Company Sync Tool's resource consumption.\n5. Press Windows + R.\n6. Enter resmon.exe and press Enter.\n7. Inspect CompanySync.exe in the Memory tab.\n8. Review hard-fault activity.\n9. Inspect paging-file activity in the Disk tab.\n10. Record Private (KB) at the beginning, after two minutes and after five minutes. Convert the recorded values to MB for comparison by dividing by 1,024.\n11. Compare the results with the original measurements.",
        whatItDoesAndHow:
          "Post-correction resource verification compares the workstation's current behavior with previously recorded evidence.\n\nA corrected application can still allocate and release memory during normal operation. Small variations in memory usage are expected.\n\nThe relevant distinction is whether the previous sustained abnormal growth continues under comparable conditions.\n\nReduced memory pressure can decrease the need for paging, which may also reduce storage activity associated with memory management.\n\nThe displayed results demonstrate improvement during the observed workload and monitoring period. They do not establish universal utilization thresholds or guarantee that no future software issue can occur.",
        whyThisMatters:
          "Comparing equivalent workloads provides stronger verification than inspecting resource usage immediately after restarting or reopening an application.\n\nThe recorded measurements support the conclusion that the previously observed performance-related conditions have improved following the approved update.",
      },
    },
    13: {
      technicalLineIds: {
        0: "computer-slow-p13-functional-heading",
        2: "computer-slow-p13-app-switching",
        3: "computer-slow-p13-explorer",
        4: "computer-slow-p13-sync",
        5: "computer-slow-p13-freezing",
        6: "computer-slow-p13-confirmation",
        7: "computer-slow-p13-resolution",
      },
      annotations: [
        {
          id: "computer-slow-p13-functional-verification",
          targetLineId: "computer-slow-p13-functional-heading",
          content: "Functional verification: Testing the original affected functionality to confirm that it operates as expected after corrective action.",
        },
        {
          id: "computer-slow-p13-user-confirmation",
          targetLineId: "computer-slow-p13-confirmation",
          content: "User confirmation: Confirmation from the affected employee that the reported problem is no longer occurring.",
        },
      ],
      learnMore: {
        howToExecute:
          "1. Repeat the application switching checks performed at the beginning of troubleshooting.\n2. Open File Explorer and repeat the original navigation checks.\n3. Confirm that Company Sync Tool completes its normal synchronization activity.\n4. Observe whether the original delays or freezing return.\n5. Ask the employee to perform their normal workstation activities.\n6. Obtain confirmation that the original performance problem is no longer occurring.",
        whatItDoesAndHow:
          "Functional verification evaluates the behavior experienced by the employee after corrective work.\n\nTechnical measurements provide evidence about the workstation's internal condition. Functional testing establishes whether the employee can perform the originally affected activities normally.\n\nUser confirmation provides additional evidence that the reported symptoms have been addressed.",
        whyThisMatters:
          "A successful software installation and improved technical measurements do not independently guarantee that the employee's original problem has been resolved.\n\nCombining technical verification, functional testing and employee confirmation establishes a supported basis for completing the troubleshooting process.",
      },
    },
  };