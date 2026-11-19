import type {
  ProcedureLearnMoreContent,
  ProcedureSideAnnotation,
} from "./procedurePresentation";

export type DhcpProcedureEducation = {
  technicalLineIds: Readonly<Record<number, string>>;
  annotations: readonly ProcedureSideAnnotation[];
  learnMore: ProcedureLearnMoreContent;
};

export const DHCP_EDUCATIONAL_CONTENT: Readonly<
  Record<number, DhcpProcedureEducation>
> = {
  1: {
    technicalLineIds: { 1: "dhcp-p01-identity-status" },
    annotations: [
      {
        id: "dhcp-p01-identity-verified",
        targetLineId: "dhcp-p01-identity-status",
        content: "Status: Verified — The required identity-verification process has been completed. This result does not provide any information about the network problem.",
      },
    ],
    learnMore: {
      howToExecute: `In a real help desk environment:
1. Follow the organization's identity-verification policy.
2. Use an approved verification method, such as an established employee verification process or an authorized identity-checking tool.
3. Confirm that the verification requirements have been satisfied before performing actions that require authorization.
4. Never request the user's password.
In the simulator, enter verify_identity.`,
      whatItDoesAndHow: `Confirms that the technician has completed the required identity-verification process.

This is a security procedure, not a Windows networking command. It does not inspect or modify the workstation.`,
      whyThisMatters: "Identity verification helps prevent unauthorized individuals from receiving sensitive account assistance or access to protected resources.\n\nNot every network diagnostic requires identity verification in a real workplace. The simulator's current V2 architecture requires this procedure before troubleshooting",
    },
  },
  2: {
    technicalLineIds: { 4: "dhcp-p02-connection-status" },
    annotations: [
      {
        id: "dhcp-p02-wifi-connected",
        targetLineId: "dhcp-p02-connection-status",
        content: "Connection: Connected — The laptop is connected to the wireless network. This does not establish that it has working internet access.",
      },
      {
        id: "dhcp-p02-status-scope",
        targetLineId: "dhcp-p02-connection-status",
        content: "The connection status reports the wireless connection, not whether the computer has received a usable IP address.",
      },
    ],
    learnMore: {
      howToExecute: `On a Windows computer:
1. Press Windows + I to open Settings.
2. Select Network & internet.
3. Select Wi-Fi.
4. Review the connected wireless network and its connection status.
Depending on the Windows version, the exact layout and labels may vary.

In the simulator, enter check_network_status. This is a simulator procedure, not a native Windows command.`,
      whatItDoesAndHow: `Checks whether the workstation is connected to a wireless network.

A Wi-Fi connection means the computer has established a wireless association with an access point. It does not automatically mean that the computer has a usable IPv4 configuration, can communicate with a gateway, or can reach websites.

This procedure reads connection information without changing network settings.`,
      whyThisMatters: `The user's complaint contains two separate observations: the computer says it is connected to Wi-Fi, but websites are not loading.

Checking the connection status helps establish whether the wireless connection itself is present. It provides an initial piece of evidence without assuming what is causing the internet problem.

This is a useful first diagnostic step because Wi-Fi connectivity and internet connectivity are not the same thing.`,
    },
  },
  3: {
    technicalLineIds: {
      3: "dhcp-p03-windows-version",
      6: "dhcp-p03-command-prompt",
    },
    annotations: [
      {
        id: "dhcp-p03-prompt",
        targetLineId: "dhcp-p03-command-prompt",
        content: `C:\\UsersOfficeUser>

This is the command prompt. It indicates the current working directory and that the interface is ready to accept a command. It is not an IP address or network location.`,
      },
      {
        id: "dhcp-p03-build",
        targetLineId: "dhcp-p03-windows-version",
        content: "Microsoft Windows [Version 10.0.26100]\n\nIdentifies the Windows operating-system build. It does not indicate whether the network connection is working.",
      },
    ],
    learnMore: {
      howToExecute: `On a Windows computer:
1. Press Windows + R to open the Run dialog.
2. Type cmd.
3. Press Enter.
4. Wait for the Command Prompt window to appear.
5. Locate the command prompt, typically ending with >.
You can also search for Command Prompt in the Windows Start menu.

In the simulator, enter open_command_prompt to represent this action.`,
      whatItDoesAndHow: `Command Prompt (cmd.exe) is a Windows command-line interface.

It allows technicians to enter commands and receive text-based results from Windows utilities. Common network diagnostic commands include ipconfig, ping, tracert, and nslookup.

Opening Command Prompt does not modify the network configuration or perform a diagnostic test by itself. It provides an interface for running commands.`,
      whyThisMatters: `Many Level 1 Help Desk troubleshooting procedures require technicians to use command-line utilities.

A beginner needs to know both how to open the tool and how to execute commands within it.

This is a transferable skill used for network connectivity, DNS troubleshooting, system information, and other Windows support tasks.`,
    },
  },
  4: {
    technicalLineIds: {
      8: "dhcp-p04-link-local-ipv6",
      9: "dhcp-p04-apipa-address",
      10: "dhcp-p04-subnet-mask",
      11: "dhcp-p04-default-gateway",
    },
    annotations: [
      {
        id: "dhcp-p04-apipa",
        targetLineId: "dhcp-p04-apipa-address",
        content: "Autoconfiguration IPv4 Address: 169.254.23.18\n\nThis is an IPv4 link-local address, commonly called an APIPA address. Windows can assign an address in the 169.254.x.x range when automatic IPv4 configuration does not provide a usable address.\n\nIt can support limited communication on the local link, but does not provide normal routed internet connectivity.",
      },
      {
        id: "dhcp-p04-subnet",
        targetLineId: "dhcp-p04-subnet-mask",
        content: "Subnet Mask: 255.255.0.0\n\nThis is the subnet mask used with the workstation's current IPv4 link-local address. It helps define which IPv4 addresses are considered part of the same local network.",
      },
      {
        id: "dhcp-p04-gateway",
        targetLineId: "dhcp-p04-default-gateway",
        content: "Default Gateway: blank\n\nNo default IPv4 gateway is configured on this adapter. A default gateway is normally used to reach destinations outside the local network.",
      },
      {
        id: "dhcp-p04-link-local-ipv6",
        targetLineId: "dhcp-p04-link-local-ipv6",
        content: "Link-local IPv6 Address\n\nAn IPv6 address used for communication on the local network link. Its presence does not establish that the workstation has working IPv4 internet access.",
      },
    ],
    learnMore: {
      howToExecute: `On a Windows computer:
1. Open Command Prompt using Windows + R, type cmd, and press Enter, if it is not already open.
2. Type ipconfig.
3. Press Enter.
4. Locate the active network adapter, such as Wireless LAN adapter Wi-Fi.
5. Review the IPv4 address, subnet mask, and default gateway.
In this simulator, Command Prompt was opened in Procedure 3, so enter ipconfig directly.`,
      whatItDoesAndHow: `ipconfig is a Windows networking utility that displays the current IP configuration of network adapters.

Without additional parameters, it shows basic information, including configured IP addresses, subnet masks, and default gateways.

It retrieves configuration information from Windows without modifying network settings.

Important terms:
- IP address: An address assigned to a network interface for network communication.
- Subnet mask: Defines the network portion of an IPv4 address.
- Default gateway: A router or next-hop address used for traffic destined outside the local network.
- APIPA: Automatic Private IP Addressing, a Windows mechanism that can assign an IPv4 link-local address when automatic addressing does not supply a usable configuration.`,
      whyThisMatters: `A computer may report that it is connected to Wi-Fi while still lacking the IP configuration needed to communicate with other networks.

Checking the basic IP configuration helps the technician identify whether the workstation has an expected IPv4 address and gateway.

In this example, the displayed 169.254.23.18 address and blank default gateway are evidence of an addressing problem. They do not, by themselves, establish whether the DHCP server, the wireless infrastructure, or another part of the network caused it.

This is a read-only diagnostic step, so it is appropriate early in troubleshooting.`,
    },
  },
  5: {
    technicalLineIds: {
      2: "dhcp-p05-available-articles",
      4: "dhcp-p05-kb204-article",
    },
    annotations: [
      {
        id: "dhcp-p05-articles",
        targetLineId: "dhcp-p05-available-articles",
        content: "Available Articles\n\nA list of internal IT documents that technicians can consult. These documents may contain configuration standards, support instructions, or troubleshooting references.",
      },
      {
        id: "dhcp-p05-kb204",
        targetLineId: "dhcp-p05-kb204-article",
        content: "KB-204 — Office Wi-Fi Network Configuration\n\nAn article concerning the organization's office wireless network. Its title indicates that it may contain relevant network configuration information.\n\nThe article has not been opened yet, so its contents are not displayed.",
      },
    ],
    learnMore: {
      howToExecute: `In a real help desk environment:
1. Locate the organization's approved IT documentation system.
2. Open it through the company intranet, a bookmarked website, or the organization's service desk platform.
3. Sign in using your authorized work account if required.
4. Browse or search the available technical documentation.
5. Identify articles relevant to the user's reported issue.
Common platforms include SharePoint, Confluence, ServiceNow Knowledge, and internal company wikis.

Not every organization uses a formal knowledge base. Some maintain documentation in shared folders or other approved systems.

In this simulator, enter open_it_knowledge_base.`,
      whatItDoesAndHow: `A Knowledge Base is a collection of documented information maintained by an organization.

It may contain:
- Standard network configurations and approved settings.
- Troubleshooting procedures.
- Equipment information.
- Common issues and documented solutions.
- Escalation instructions and support policies.
Opening the Knowledge Base gives the technician access to reference information.

It does not test, repair, or change the user's computer.

The listed articles are documents, not live measurements of network equipment.`,
      whyThisMatters: `Technicians should not have to guess an organization's expected network settings.

Internal documentation can help establish what a properly configured workstation or network is supposed to look like.

Comparing documented expectations with actual diagnostic results is a fundamental troubleshooting skill.

Documentation can be outdated, incomplete, or restricted by permissions. If a technician cannot access required information, they should use the organization's approved support or escalation process rather than guess.`,
    },
  },
  6: {
    technicalLineIds: {
      2: "dhcp-p06-network-name",
      3: "dhcp-p06-ipv4-subnet",
      4: "dhcp-p06-gateway",
      5: "dhcp-p06-dhcp-server",
      6: "dhcp-p06-addressing-method",
    },
    annotations: [
      {
        id: "dhcp-p06-network-name",
        targetLineId: "dhcp-p06-network-name",
        content: "Network Name: Office Wi-Fi\n\nThe documented wireless network name. This identifies the network the workstation is expected to use.",
      },
      {
        id: "dhcp-p06-subnet",
        targetLineId: "dhcp-p06-ipv4-subnet",
        content: "IPv4 Subnet: 192.168.1.0/24\n\nThe documented IPv4 network range. The /24 prefix corresponds to subnet mask 255.255.255.0, with typical usable host addresses from 192.168.1.1 through 192.168.1.254.",
      },
      {
        id: "dhcp-p06-gateway",
        targetLineId: "dhcp-p06-gateway",
        content: "Gateway: 192.168.1.1\n\nThe documented default gateway address. It is the expected next-hop address for traffic leaving this local IPv4 network. The article does not establish whether that gateway is currently reachable.",
      },
      {
        id: "dhcp-p06-dhcp-server",
        targetLineId: "dhcp-p06-dhcp-server",
        content: "DHCP Server: 192.168.1.10\n\nThe documented server responsible for providing automatic IPv4 configuration. Its listing does not establish that the server is currently reachable or functioning.",
      },
      {
        id: "dhcp-p06-addressing",
        targetLineId: "dhcp-p06-addressing-method",
        content: "Addressing: Automatic (DHCP)\n\nWorkstations are expected to obtain their IPv4 configuration automatically rather than require technicians to manually enter a static address.",
      },
    ],
    learnMore: {
      howToExecute: `In a real help desk environment:
1. Open the organization's approved IT Knowledge Base.
2. Search for the article number KB-204 or a relevant title such as Office Wi-Fi Network Configuration.
3. Open the matching article.
4. Confirm that it applies to the correct office, wireless network, and environment.
5. Review the documented subnet, default gateway, DHCP server, and addressing method.
6. Keep the information available for comparison with workstation diagnostics.
In the simulator, after opening the IT Knowledge Base, enter open_kb_204.

Article identifiers and documentation platforms differ between organizations.`,
      whatItDoesAndHow: `This procedure retrieves the organization's documented network configuration.

It provides reference values against which the technician can compare the workstation's actual network settings.

Key concepts:
- Subnet: The defined range of IP addresses belonging to a particular network.
- Default gateway: The router or next-hop address used to reach destinations outside the local subnet.
- DHCP (Dynamic Host Configuration Protocol): A protocol that automatically provides network configuration, such as an IPv4 address, subnet mask, default gateway, and potentially DNS server information.
- Automatic addressing: The workstation is configured to obtain network settings through DHCP rather than use manually assigned static settings.
Reading the article does not change the workstation's configuration or test network connectivity.`,
      whyThisMatters: `A technician needs a reliable reference for what the workstation's network configuration should be.

Without organizational documentation, a technician might incorrectly assume that an unfamiliar IP address or gateway is wrong.

In this scenario, the workstation previously displayed an automatically configured 169.254.23.18 IPv4 address with no default gateway. KB-204 establishes that the office normally uses the 192.168.1.0/24 network with automatic DHCP addressing.

That comparison provides stronger evidence of a configuration mismatch, but does not establish why the expected configuration was not obtained.

Knowing the expected configuration also helps the technician interpret subsequent diagnostic results without guessing network addresses.`,
    },
  },
  7: {
    technicalLineIds: {
      2: "dhcp-p07-ping-target",
      3: "dhcp-p07-transmit-failure",
      9: "dhcp-p07-packet-statistics",
    },
    annotations: [
      {
        id: "dhcp-p07-ping-target",
        targetLineId: "dhcp-p07-ping-target",
        content: "Pinging 192.168.1.1 with 32 bytes of data\n\nWindows is attempting to send ICMP Echo Request packets to the specified IPv4 address. By default, Windows ping sends four requests.",
      },
      {
        id: "dhcp-p07-transmit-failure",
        targetLineId: "dhcp-p07-transmit-failure",
        content: "PING: transmit failed. General failure.\n\nWindows reports that it could not successfully transmit the ping request.\n\nThis is a local transmission failure indication, not evidence that the gateway received the request and refused to answer.",
      },
      {
        id: "dhcp-p07-packet-loss",
        targetLineId: "dhcp-p07-packet-statistics",
        content: "Lost = 4 (100% loss)\n\nNone of the four requests produced a successful reply.\n\nThis does not prove the gateway is offline. A failed ping can have multiple causes, including local configuration problems, routing problems, or network filtering.",
      },
    ],
    learnMore: {
      howToExecute: `On a Windows computer:
1. Open Command Prompt if it is not already open.
2. Identify the gateway address from the workstation's configuration or approved network documentation.
3. Type ping 192.168.1.1.
4. Press Enter.
5. Read the individual responses or errors.
6. Review the packet statistics at the end of the test.
In this scenario, KB-204 documents 192.168.1.1 as the office gateway. Other organizations may use different addresses.`,
      whatItDoesAndHow: `ping is a network diagnostic utility that uses the Internet Control Message Protocol (ICMP).

It sends Echo Request messages to a destination and checks for Echo Replies.

When a reply is received, Windows can display the responding address, round-trip time, and Time to Live (TTL) value.

The command can help determine whether an IP destination responds to ICMP traffic.

A failed ping is not always proof that a device is unavailable. Some devices or firewalls block ICMP traffic, and local networking problems can prevent a request from being transmitted.`,
      whyThisMatters: `The default gateway is normally the workstation's path to destinations outside its local IPv4 network.

Testing the documented gateway helps assess whether the workstation can communicate with that network destination.

Earlier, ipconfig displayed an APIPA address (169.254.23.18) and no configured default gateway. The failed test is consistent with that abnormal IPv4 configuration.

However, the ping result alone does not establish the precise cause of the network problem or prove that the gateway itself is malfunctioning.`,
    },
  },
  8: {
    technicalLineIds: {
      0: "dhcp-p08-external-ip-target",
      3: "dhcp-p08-transmit-failure",
      9: "dhcp-p08-packet-statistics",
    },
    annotations: [
      {
        id: "dhcp-p08-external-ip",
        targetLineId: "dhcp-p08-external-ip-target",
        content: "8.8.8.8 — External IP Address\n\nA public IPv4 address operated by Google for its Public DNS service. Here, it serves as a known external destination for a basic connectivity test.\n\nPinging this address does not test whether DNS name resolution is working.",
      },
      {
        id: "dhcp-p08-transmit-failure",
        targetLineId: "dhcp-p08-transmit-failure",
        content: "PING: transmit failed. General failure.\n\nWindows reports that it could not successfully transmit the request.\n\nThis is not the same as sending a request and receiving no reply. The error does not establish that the remote destination is unavailable.",
      },
      {
        id: "dhcp-p08-packet-loss",
        targetLineId: "dhcp-p08-packet-statistics",
        content: "Lost = 4 (100% loss)\n\nFour requests were attempted, and none produced a successful reply.\n\nThe statistics describe the failed test; they do not independently identify the underlying cause.",
      },
    ],
    learnMore: {
      howToExecute: `On a Windows computer:
1. Open Command Prompt if it is not already open.
2. Type ping 8.8.8.8.
3. Press Enter.
4. Observe the individual replies or error messages.
5. Review the packet statistics when the test finishes.
Windows normally sends four ICMP Echo Requests unless a different count is specified.

In this simulator, Command Prompt is already open from Procedure 3.`,
      whatItDoesAndHow: `The ping utility uses ICMP Echo Request and Echo Reply messages to test whether an IP destination responds.

Unlike pinging the office's local gateway, ping 8.8.8.8 targets an address outside the documented office subnet.

Normally, traffic to an external IPv4 address must be forwarded through a suitable route, typically via the default gateway.

Because the command uses a numeric IP address rather than a hostname, it does not require DNS to translate a name into an address.

A successful reply would demonstrate ICMP connectivity to that external destination at the time of the test. It would not guarantee that websites or every internet service work.`,
      whyThisMatters: `Testing the local gateway and an external IP address examines two different aspects of connectivity.

The gateway test concerns communication with a local network destination. The external IP test concerns the ability to reach a destination beyond the local network.

In this scenario, both tests fail while the workstation has an APIPA address and no configured default IPv4 gateway.

Those observations are consistent with the workstation's abnormal IPv4 configuration, but they do not prove that the office gateway, internet provider, or Google Public DNS service is malfunctioning.

This gives the technician additional evidence about the current connectivity problem without changing the workstation's settings.`,
    },
  },
  9: {
    technicalLineIds: {
      15: "dhcp-p09-dhcp-enabled",
      16: "dhcp-p09-auto-configuration",
      18: "dhcp-p09-apipa-address",
      20: "dhcp-p09-default-gateway",
      14: "dhcp-p09-physical-address",
    },
    annotations: [
      {
        id: "dhcp-p09-dhcp-enabled",
        targetLineId: "dhcp-p09-dhcp-enabled",
        content: "DHCP Enabled: Yes\n\nThe Wi-Fi adapter is configured to obtain its IPv4 settings automatically through DHCP. This does not establish that a DHCP server successfully provided a lease.",
      },
      {
        id: "dhcp-p09-auto-configuration",
        targetLineId: "dhcp-p09-auto-configuration",
        content: "Autoconfiguration Enabled: Yes\n\nWindows can use automatic address configuration when an appropriate IPv4 configuration is not obtained.",
      },
      {
        id: "dhcp-p09-apipa-address",
        targetLineId: "dhcp-p09-apipa-address",
        content: "Autoconfiguration IPv4 Address: 169.254.23.18\n\nThe workstation is using an APIPA address rather than an address in the documented 192.168.1.0/24 office subnet.\n\nThis is evidence of an automatic IPv4 addressing problem, but not proof of a specific DHCP server failure.",
      },
      {
        id: "dhcp-p09-default-gateway",
        targetLineId: "dhcp-p09-default-gateway",
        content: "Default Gateway: blank\n\nNo default IPv4 gateway is configured on this adapter. The workstation therefore lacks the normal IPv4 route for reaching destinations outside its local network.",
      },
      {
        id: "dhcp-p09-physical-address",
        targetLineId: "dhcp-p09-physical-address",
        content: "Physical Address: 02-1A-2B-3C-4D-5E\n\nThe adapter's MAC address, used to identify the network interface at the local network-link level. It is different from the workstation's IP address.",
      },
    ],
    learnMore: {
      howToExecute: `On a Windows computer:
1. Open Command Prompt using Windows + R, type cmd, and press Enter, if it is not already open.
2. Type ipconfig /all.
3. Press Enter.
4. Find the active network adapter, such as Wireless LAN adapter Wi-Fi.
5. Review its IPv4 address, subnet mask, default gateway, DHCP status, DNS servers (if listed), and other relevant configuration details.
6. Compare the displayed settings with the organization's approved network documentation.
In this simulator, Command Prompt is already open.`,
      whatItDoesAndHow: `ipconfig /all displays more detailed network configuration information than ipconfig alone.

The /all parameter tells Windows to include additional adapter and TCP/IP configuration details.

Depending on the adapter and its configuration, these may include the physical (MAC) address, DHCP status, DHCP server, DNS servers, and lease information.

Important distinctions:
- DHCP Enabled: Yes means the adapter is configured to request automatic network settings.
- DHCP Server identifies a DHCP server associated with the adapter's configuration when that information is available.
- Lease Obtained / Lease Expires can show when a DHCP lease was acquired and when it expires, if a lease exists.
- DNS Servers identifies configured name-resolution servers, when present.
This command is read-only. It displays configuration information without renewing an address or changing network settings.`,
      whyThisMatters: `Basic ipconfig output revealed an unusual IPv4 address and missing gateway. The detailed output provides more context about how the adapter is configured.

In this scenario, the important distinction is that DHCP is enabled, but the workstation does not currently have the documented office IPv4 configuration.

The technician can compare these findings with KB-204, which specifies automatic DHCP addressing on the 192.168.1.0/24 network.

This supports identifying an addressing problem without assuming that the DHCP server itself is broken.`,
    },
  },
  10: {
    technicalLineIds: {
      7: "dhcp-p10-dns-suffix",
      8: "dhcp-p10-ipv4-address",
      9: "dhcp-p10-subnet-mask",
      10: "dhcp-p10-default-gateway",
    },
    annotations: [
      {
        id: "dhcp-p10-ipv4-address",
        targetLineId: "dhcp-p10-ipv4-address",
        content: "IPv4 Address: 192.168.1.100\n\nThe workstation now has an IPv4 address within the documented office subnet, 192.168.1.0/24.\n\nThis replaces the earlier APIPA configuration of 169.254.23.18.",
      },
      {
        id: "dhcp-p10-subnet-mask",
        targetLineId: "dhcp-p10-subnet-mask",
        content: "Subnet Mask: 255.255.255.0\n\nThis corresponds to the /24 subnet documented in KB-204.",
      },
      {
        id: "dhcp-p10-default-gateway",
        targetLineId: "dhcp-p10-default-gateway",
        content: "Default Gateway: 192.168.1.1\n\nThe workstation now has the documented office gateway configured.\n\nThis does not independently prove that the gateway is reachable or that internet access works.",
      },
      {
        id: "dhcp-p10-dns-suffix",
        targetLineId: "dhcp-p10-dns-suffix",
        content: "Connection-specific DNS Suffix: office.example\n\nA DNS suffix associated with the network connection. It can be used when resolving certain unqualified hostnames.\n\nThis field does not identify the DNS server or prove that DNS resolution works.",
      },
    ],
    learnMore: {
      howToExecute: `On a Windows computer:
1. Open Command Prompt if it is not already open.
2. Type ipconfig /renew.
3. Press Enter.
4. Wait while Windows attempts to obtain or renew the adapter's DHCP configuration.
5. Review the resulting IPv4 address, subnet mask, and default gateway.
6. Check for any errors or messages indicating that the renewal failed.
In this simulator, Command Prompt was opened in Procedure 3.

A renewal may briefly interrupt network connectivity. The command applies to DHCP-enabled adapters and may attempt renewal on more than one adapter if none is specified.`,
      whatItDoesAndHow: `ipconfig /renew instructs Windows to request or renew IP configuration through DHCP.

DHCP stands for Dynamic Host Configuration Protocol.

The DHCP client communicates with a DHCP server to obtain or renew configuration information. Depending on the client's current state, this may involve requesting an existing lease or obtaining a new one.

The configuration can include:
- IPv4 address.
- Subnet mask.
- Default gateway.
- DNS server addresses.
- Lease duration and related information.
Unlike ipconfig or ipconfig /all, this command can change the workstation's active network configuration.`,
      whyThisMatters: `Earlier diagnostics established that the workstation:
- Was connected to Office Wi-Fi.
- Had an APIPA address, 169.254.23.18.
- Had no configured default IPv4 gateway.
- Was configured to use DHCP.
- Could not successfully complete the local gateway or external IP ping tests.
Requesting a DHCP renewal is an appropriate troubleshooting action when a DHCP-enabled workstation has not obtained the expected IPv4 configuration.

In this scenario, the renewal succeeds and Windows displays an address and gateway consistent with KB-204.

That establishes an improvement in the workstation's IP configuration, not yet confirmation that the user's internet problem is resolved. Connectivity must still be verified.`,
    },
  },
  11: {
    technicalLineIds: {
      18: "dhcp-p11-ipv4-address",
      22: "dhcp-p11-default-gateway",
      23: "dhcp-p11-dhcp-server",
      20: "dhcp-p11-lease-obtained",
      21: "dhcp-p11-lease-expires",
      26: "dhcp-p11-dns-server",
    },
    annotations: [
      {
        id: "dhcp-p11-ipv4-address",
        targetLineId: "dhcp-p11-ipv4-address",
        content: "IPv4 Address: 192.168.1.100\n\nThe workstation now has an IPv4 address within the documented 192.168.1.0/24 office network, replacing the earlier APIPA address.",
      },
      {
        id: "dhcp-p11-default-gateway",
        targetLineId: "dhcp-p11-default-gateway",
        content: "Default Gateway: 192.168.1.1\n\nThe configured gateway matches KB-204. This establishes the expected gateway setting, not whether the gateway responds to traffic.",
      },
      {
        id: "dhcp-p11-dhcp-server",
        targetLineId: "dhcp-p11-dhcp-server",
        content: "DHCP Server: 192.168.1.10\n\nIdentifies the DHCP server associated with the workstation's current lease. It matches the server documented in KB-204.",
      },
      {
        id: "dhcp-p11-lease-period",
        targetLineId: "dhcp-p11-lease-obtained",
        content: "Lease Obtained / Lease Expires\n\nShows when the DHCP lease was acquired and when its current validity period ends. This example represents a 24-hour lease.",
      },
      {
        id: "dhcp-p11-dns-server",
        targetLineId: "dhcp-p11-dns-server",
        content: "DNS Servers: 192.168.1.10\n\nIdentifies a configured DNS server used for hostname resolution. The address being present does not prove that DNS queries succeed.",
      },
    ],
    learnMore: {
      howToExecute: `On a Windows computer:
1. Open Command Prompt if it is not already open.
2. Type ipconfig /all.
3. Press Enter.
4. Locate the active Wi-Fi adapter.
5. Examine its IPv4 address, subnet mask, default gateway, DHCP server, DNS servers, and lease information.
6. Compare the displayed values with earlier results and the organization's approved network documentation.
In this simulator, Command Prompt is already open from Procedure 3.`,
      whatItDoesAndHow: `ipconfig /all displays detailed TCP/IP configuration information for the workstation's network adapters.

It can show which DHCP server supplied the current lease, the lease's timing, the configured DNS servers, and the adapter's current IP settings.

The command is read-only. It does not renew the lease, send connectivity tests, or change the configuration.

Why repeat it? Running the same diagnostic command at different points allows a technician to compare the workstation's configuration before and after a troubleshooting action.`,
      whyThisMatters: `Before the renewal, the workstation had an APIPA address, no default gateway, and no usable office IPv4 configuration.

The current output shows a valid office-subnet address, the documented gateway, a DHCP server, and lease information.

That provides evidence that the workstation obtained an appropriate DHCP configuration.

However, correct configuration alone does not prove that the workstation can communicate with the gateway, reach external destinations, resolve domain names, or load websites.

The distinction between confirming configuration and confirming connectivity is an important troubleshooting skill.`,
    },
  },
  12: {
    technicalLineIds: {
      3: "dhcp-p12-gateway-reply",
      9: "dhcp-p12-packet-statistics",
    },
    annotations: [
      {
        id: "dhcp-p12-reply",
        targetLineId: "dhcp-p12-gateway-reply",
        content: "Reply from 192.168.1.1\n\nThe documented gateway address responded to the ICMP Echo Request.\n\nThis provides evidence that the workstation can communicate with that local network destination.",
      },
      {
        id: "dhcp-p12-payload-bytes",
        targetLineId: "dhcp-p12-gateway-reply",
        content: "bytes=32\n\nIndicates the amount of ICMP data included in the Echo Reply. Windows uses 32 bytes of data by default for a standard ping request.",
      },
      {
        id: "dhcp-p12-round-trip-time",
        targetLineId: "dhcp-p12-gateway-reply",
        content: "time=1ms / time=2ms\n\nShows the approximate round-trip time for each successful request, measured in milliseconds.\n\nThese are short response times, consistent with a nearby local network device.",
      },
      {
        id: "dhcp-p12-ttl",
        targetLineId: "dhcp-p12-gateway-reply",
        content: "TTL=64\n\nTTL stands for Time to Live. It is an IP header value that limits how many routing hops a packet can traverse.\n\nThe displayed TTL is the value remaining in the received reply. It does not measure connection speed.",
      },
      {
        id: "dhcp-p12-packet-statistics",
        targetLineId: "dhcp-p12-packet-statistics",
        content: "Received = 4, Lost = 0 (0% loss)\n\nAll four requests received replies.\n\nThis confirms successful ICMP communication with the gateway during this test, but does not establish that external internet access works.",
      },
    ],
    learnMore: {
      howToExecute: `On a Windows computer:
1. Open Command Prompt if it is not already open.
2. Identify the expected gateway address from the workstation's configuration or approved network documentation.
3. Type ping 192.168.1.1.
4. Press Enter.
5. Review the individual responses.
6. Examine the packet statistics and round-trip times.
7. Compare the results with any earlier connectivity tests.
In this scenario, KB-204 identifies 192.168.1.1 as the office gateway. Command Prompt is already open.`,
      whatItDoesAndHow: `The ping utility sends ICMP Echo Requests to an IP address and checks whether Echo Replies are received.

Successful replies demonstrate that ICMP packets can travel to the destination and responses can return to the workstation.

Windows also reports response times, packet counts, packet loss, and TTL values.

Repeating a diagnostic test after a configuration change allows technicians to compare the results under different conditions.

Ping does not verify every network service or protocol. It specifically tests ICMP connectivity to the selected destination.`,
      whyThisMatters: `Earlier in this scenario, the gateway ping failed while the workstation had an APIPA address and no configured default gateway.

After the DHCP renewal, ipconfig /all showed that the workstation had received an office-subnet address and the documented gateway.

The new ping results provide additional evidence: the workstation can now exchange ICMP traffic with the gateway.

This is stronger than simply seeing the correct gateway address in the configuration.

However, successful communication with the local gateway does not automatically mean the workstation can reach external networks, resolve domain names, or load websites.

The technician has confirmed improvement in local network connectivity without prematurely declaring the original problem resolved.`,
    },
  },
  13: {
    technicalLineIds: {
      3: "dhcp-p13-external-ip-reply",
      9: "dhcp-p13-packet-statistics",
    },
    annotations: [
      {
        id: "dhcp-p13-reply",
        targetLineId: "dhcp-p13-external-ip-reply",
        content: "Reply from 8.8.8.8\n\nThe external IP destination responded to the ICMP Echo Requests.\n\nThis provides evidence that the workstation can now communicate with a destination outside the office network.",
      },
      {
        id: "dhcp-p13-payload-bytes",
        targetLineId: "dhcp-p13-external-ip-reply",
        content: "bytes=32\n\nIndicates the amount of data in the ICMP Echo Reply. Windows uses 32 bytes of data by default.",
      },
      {
        id: "dhcp-p13-round-trip-time",
        targetLineId: "dhcp-p13-external-ip-reply",
        content: "time=18ms through time=21ms\n\nShows the approximate round-trip time for each request, measured in milliseconds.\n\nThese values are illustrative and represent successful responses from an external destination.",
      },
      {
        id: "dhcp-p13-ttl",
        targetLineId: "dhcp-p13-external-ip-reply",
        content: "TTL=117\n\nTTL stands for Time to Live. The displayed value is the remaining TTL in the received IP packet.\n\nIt is not a measure of connection speed or internet bandwidth.",
      },
      {
        id: "dhcp-p13-packet-statistics",
        targetLineId: "dhcp-p13-packet-statistics",
        content: "Received = 4, Lost = 0 (0% loss)\n\nAll four ping requests received replies.\n\nThis confirms successful ICMP connectivity to the selected external destination during this test, not that every internet service is working.",
      },
    ],
    learnMore: {
      howToExecute: `On a Windows computer:
1. Open Command Prompt if it is not already open.
2. Type ping 8.8.8.8.
3. Press Enter.
4. Observe the individual replies or error messages.
5. Review the packet statistics and response times.
6. Compare the results with earlier tests.
In this simulator, Command Prompt is already open from Procedure 3.`,
      whatItDoesAndHow: `The ping utility sends ICMP Echo Requests to a specified destination and checks whether Echo Replies are received.

8.8.8.8 is a public IPv4 address operated by Google for its Public DNS service. In this procedure, it is being used as an external IP connectivity target.

Because the destination is specified as a numeric IP address, Windows does not need to resolve a hostname through DNS before sending the requests.

Successful replies demonstrate that ICMP communication to that external address worked during the test.

This does not measure overall internet speed, verify DNS name resolution, or confirm that websites load.`,
      whyThisMatters: `Earlier, the external ping failed while the workstation had an APIPA address and no configured default gateway.

After the DHCP renewal, the workstation received the documented office network configuration and successfully communicated with the local gateway.

This new test shows that the workstation can also reach an external IP destination.

The technician now has evidence of improvement at three levels: IP configuration, local gateway connectivity, and external IP connectivity.

The original complaint involved websites not loading, so successful external ping responses are encouraging but do not independently establish that the user's original problem is resolved.`,
    },
  },
  14: {
    technicalLineIds: {
      1: "dhcp-p14-dns-server-name",
      2: "dhcp-p14-dns-server-address",
      4: "dhcp-p14-response-type",
      5: "dhcp-p14-query-name",
      6: "dhcp-p14-resolved-address",
    },
    annotations: [
      {
        id: "dhcp-p14-dns-server-name",
        targetLineId: "dhcp-p14-dns-server-name",
        content: "Server: dns.office.example\n\nThe name of the DNS server that answered the query.\n\nIn this scenario, it is the office DNS server.",
      },
      {
        id: "dhcp-p14-dns-server-address",
        targetLineId: "dhcp-p14-dns-server-address",
        content: "Address: 192.168.1.10\n\nThe IP address of the DNS server used for the lookup.\n\nThis matches the DNS server shown in Procedure 11's ipconfig /all output.\n\nIt is not the IP address of google.com.",
      },
      {
        id: "dhcp-p14-response-type",
        targetLineId: "dhcp-p14-response-type",
        content: "Non-authoritative answer\n\nThe DNS response came from a server that is not authoritative for the requested domain.\n\nThis is normal when a local or recursive DNS server provides a response for an external domain. It does not mean the lookup failed.",
      },
      {
        id: "dhcp-p14-query-name",
        targetLineId: "dhcp-p14-query-name",
        content: "Name: google.com\n\nIdentifies the domain name that was queried.",
      },
      {
        id: "dhcp-p14-resolved-address",
        targetLineId: "dhcp-p14-resolved-address",
        content: "Address: 142.250.190.14\n\nAn IPv4 address returned for google.com.\n\nThis demonstrates that the DNS server supplied an address for the requested domain. It does not prove that the website itself can be opened.",
      },
    ],
    learnMore: {
      howToExecute: `On a Windows computer:
1. Open Command Prompt if it is not already open.
2. Type nslookup google.com.
3. Press Enter.
4. Identify the DNS server listed at the top of the results.
5. Examine the returned domain name and IP address.
6. Check whether an address was returned or an error occurred.
7. Compare the DNS server address with the workstation's network configuration.
In this simulator, Command Prompt is already open from Procedure 3.`,
      whatItDoesAndHow: `nslookup stands for Name Server Lookup.

It is a diagnostic utility used to query DNS servers for information about domain names.

DNS stands for Domain Name System. It translates domain names, such as google.com, into IP addresses that computers can use to identify network destinations.

When the technician runs nslookup google.com, the utility queries a DNS server and displays the response.

In this scenario, the workstation's configured DNS server is 192.168.1.10, and it successfully returns an IPv4 address for google.com.

The command is read-only and does not change the workstation's IP or DNS configuration.`,
      whyThisMatters: `The workstation originally had an APIPA address and could not successfully communicate with the local gateway or external IP destination.

After the DHCP renewal, the technician confirmed:
- The workstation received the expected office IP configuration.
- The default gateway responded successfully.
- An external IP destination responded successfully.
However, those earlier tests did not establish that domain names could be resolved.

This DNS lookup provides additional evidence that the workstation can communicate with its configured DNS server and receive an address for a domain name.

Successful DNS resolution is another important part of restoring normal internet functionality, but it does not independently confirm that the user's websites load correctly.`,
    },
  },
  15: {
    technicalLineIds: {
      7: "dhcp-p15-browser-result",
      11: "dhcp-p15-user-confirmation",
      14: "dhcp-p15-final-status",
    },
    annotations: [
      {
        id: "dhcp-p15-browser-test",
        targetLineId: "dhcp-p15-browser-result",
        content: "Browser Test: Page loaded successfully\n\nConfirms that the workstation successfully retrieved and displayed the selected website through a browser.\n\nThis provides more direct evidence of working website access than a successful ping alone.",
      },
      {
        id: "dhcp-p15-user-verification",
        targetLineId: "dhcp-p15-user-confirmation",
        content: "User confirms websites now load\n\nThe user verifies that the original symptom is no longer occurring.\n\nThis matters because a technician's successful test does not always establish that the user's specific problem is resolved.",
      },
      {
        id: "dhcp-p15-final-status",
        targetLineId: "dhcp-p15-final-status",
        content: "Internet and website access verified successfully\n\nThe technical tests and user confirmation support marking the connectivity issue as resolved.\n\nThe ticket has not yet been documented or closed.",
      },
    ],
    learnMore: {
      howToExecute: `On a real Windows workstation:
1. Open a web browser, such as Microsoft Edge or Google Chrome.
2. Navigate to a known website, such as https://www.google.com.
3. Wait for the page to load.
4. Check whether the website displays normally or shows a connection error.
5. Ask the user to open one or more websites that previously failed.
6. Confirm with the user whether normal website access has been restored.
7. Record the verification results for the support ticket.
In MyHelpDeskSim: Enter test_internet_connection to perform the simulated browser and user verification.`,
      whatItDoesAndHow: `This procedure verifies the workstation's ability to access websites through a browser.

A successful HTTPS website load involves several networking components working together, including:
- DNS name resolution to identify the destination.
- Network connectivity to reach the destination.
- TCP and TLS communication to establish a secure connection.
- HTTP communication to request and receive website content.
- Browser processing to display the page.
Unlike ping or nslookup, this procedure evaluates the user's actual browser functionality rather than a single network diagnostic operation.

The simulator combines the browser test and the user's confirmation into one procedure result.`,
      whyThisMatters: `The original complaint was that websites would not load, not simply that the workstation had an incorrect IP address.

The previous procedures established that the workstation obtained the documented DHCP configuration and could communicate with its gateway, an external IP destination, and its configured DNS server.

Those findings support the diagnosis, but none independently confirms that the user's browser problem has been resolved.

This procedure closes that verification gap by checking actual website access and obtaining confirmation from the user.

The issue can now be considered resolved based on the scenario's successful tests and user confirmation. The remaining administrative work is to document the troubleshooting and outcome.`,
    },
  },
};
