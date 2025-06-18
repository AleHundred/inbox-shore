import { faker } from '@faker-js/faker';

import { RequestStatus } from '@/lib/types/api';
import type {
  CustomerData,
  RequestDetailResponse,
  RequestSummary,
  RequestsResponse,
  TimelineEntry,
  PageInfo,
} from '@/lib/types/api';

const mockUsers = [
  { id: 'user_1', name: 'Lucy Dacus' },
  { id: 'user_2', name: 'Julien Baker' },
  { id: 'user_3', name: 'Phoebe Bridgers' },
];

const mockCustomers: Record<string, CustomerData> = {
  customer_1: {
    id: 'customer_1',
    fullName: 'Sharon Van Etten',
    email: 'sharon.mother@example.com',
  },
  customer_2: {
    id: 'customer_2',
    fullName: 'Maggie Rogers',
    email: 'maggie.rogers@example.com',
  },
  customer_3: {
    id: 'customer_3',
    fullName: 'Annie Clark',
    email: 'annie.clark@example.com',
  },
};

/**
 * Music-related ticket titles
 */
const musicTitles = [
  'Issue with tour booking platform',
  'Digital audio workstation crashes during recording',
  'Streaming royalties calculation error',
  'Venue booking confirmation missing',
  'Music licensing documentation needed',
  'Band collaboration tools not syncing',
  'Concert ticket sales platform down',
  'Recording session scheduling conflict',
  'Merchandise store payment processing',
  'Fan mailing list export request',
  'Sound engineer contact database',
  'Album artwork upload failing',
  'Setlist management app bug',
  'Tour bus rental coordination',
  'Studio equipment rental pricing',
  'Music video upload timeout',
  'Songwriter credits missing from system',
  'Venue capacity calculations incorrect',
  'Pre-order campaign setup help',
  'Social media integration broken',
  'Playlist submission automation',
  'Concert photography delivery',
];

/**
 * Music-related preview texts
 */
const musicPreviews = [
  'Our upcoming tour dates are not appearing correctly in the booking system.',
  'The DAW keeps crashing when we try to export our latest recording sessions.',
  'There seems to be a discrepancy in the streaming royalty calculations for last quarter.',
  'We never received confirmation for our venue booking despite payment going through.',
  'Need help obtaining proper licensing documentation for our cover songs.',
  'The band collaboration platform is not syncing changes across all member accounts.',
  'Fans are reporting they cannot purchase tickets through the concert portal.',
  'Double-booked recording sessions are causing conflicts in our studio schedule.',
  'Payment processing is failing for merchandise orders on our online store.',
  'Request to export our fan mailing list for the upcoming album announcement.',
  'Cannot access the sound engineer contact database for tour preparation.',
  'Album artwork files are failing to upload to the distribution platform.',
  'The setlist management app is not saving our tour setlists properly.',
  'Need assistance coordinating tour bus rentals for the upcoming dates.',
  'Studio equipment rental pricing seems incorrect compared to our contract.',
  'Music video uploads are timing out before completion on the platform.',
  'Songwriter credits are missing from several tracks in the system.',
  'Venue capacity calculations are showing wrong numbers for ticket sales.',
  'Having trouble setting up the pre-order campaign for our new release.',
  'Social media integration stopped working after the recent platform update.',
  'Playlist submission automation is not working for music streaming services.',
  'Concert photography delivery system is not sending files to the band.',
];

/**
 * Deterministic faker for stable pagination
 */
function seedFaker(seed: number) {
  faker.seed(seed);
}

/**
 * Get customer data by ID, ensuring we always return a valid customer
 */
function getCustomerById(customerId: string): CustomerData {
  return mockCustomers[customerId] || (mockCustomers['customer_1'] as CustomerData);
}

/**
 * Generate a timestamp for a request based on its number
 * Higher request numbers get more recent timestamps
 */
function generateTimestampForRequest(requestNumber: number): string {
  const baseDate = new Date('2025-05-15T10:00:00Z');
  const hoursToAdd = requestNumber * 2;
  const requestDate = new Date(baseDate.getTime() + hoursToAdd * 60 * 60 * 1000);
  return requestDate.toISOString();
}

/**
 * Generate music-related ticket titles
 */
function generateMusicTicketTitle(requestNumber: number): string {
  const titleIndex = (requestNumber - 1) % musicTitles.length;
  const baseTitle = musicTitles[titleIndex];
  return `#R${requestNumber} ${baseTitle}`;
}

/**
 * Generate music-related preview text
 */
function generateMusicPreviewText(requestNumber: number): string {
  const previewIndex = (requestNumber - 1) % musicPreviews.length;
  return musicPreviews[previewIndex] ?? 'No preview text available';
}

/**
 * Generate a fake ticket summary
 */
function generateFakeTicketSummary(ticketId: string, requestNumber: number): RequestSummary {
  const idNum = Number(ticketId.replace(/[^0-9]/g, '')) || 1;
  seedFaker(idNum);

  const customerId = `customer_${(idNum % 3) + 1}`;
  const customer = getCustomerById(customerId);

  return {
    id: ticketId,
    title: generateMusicTicketTitle(requestNumber),
    status: faker.helpers.arrayElement([
      RequestStatus.TODO,
      RequestStatus.IN_PROGRESS,
      RequestStatus.DONE,
    ]),
    priority: faker.number.int({ min: 1, max: 3 }),
    customer: {
      id: customer.id,
      fullName: customer.fullName,
    },
    updatedAt: {
      iso8601: generateTimestampForRequest(requestNumber),
    },
    previewText: generateMusicPreviewText(requestNumber),
  };
}

/**
 * Generate music-related timeline entry text
 */
function generateMusicTimelineText(requestNumber: number, entryIdx: number): string {
  const musicResponses = [
    'Thanks for reaching out about this issue. Let me look into your account settings.',
    'I can see the problem in our system. Working on a fix now.',
    'This appears to be related to the recent platform update. Investigating.',
    "I've escalated this to our technical team for a deeper review.",
    'Good news! I was able to resolve this issue on my end.',
    'Can you try refreshing your browser and let me know if that helps?',
    "I've sent you an email with detailed steps to resolve this.",
    "This is a known issue and we're working on a permanent solution.",
  ];
  const textIndex = (requestNumber + entryIdx) % musicResponses.length;
  return musicResponses[textIndex] ?? 'No response text available';
}

/**
 * Generate a fake timeline entry
 */
function generateFakeTimelineEntry(
  ticketId: string,
  entryIdx: number,
  customer: CustomerData
): TimelineEntry {
  const requestNumber = Number(ticketId.replace(/[^0-9]/g, '')) || 1;
  const isCustomer = entryIdx % 2 === 0;
  const text = generateMusicTimelineText(requestNumber, entryIdx);

  const user = isCustomer ? null : faker.helpers.arrayElement(mockUsers);

  return {
    id: `${ticketId}_entry_${entryIdx}`,
    timestamp: faker.date.recent({ days: 10 - entryIdx }).toISOString(),
    actorType: isCustomer ? 'customer' : 'user',
    actorName: isCustomer ? customer.fullName : user?.name || 'Support Agent',
    entryType: isCustomer ? 'message' : faker.helpers.arrayElement(['message', 'status_change']),
    components: [
      {
        type: 'text',
        text,
      },
    ],
    text,
    chatId: `${ticketId}_chat_${entryIdx}`,
    ...(entryIdx % 3 === 0 && !isCustomer
      ? { title: 'Status changed', components: [{ type: 'text', text: 'Status updated.' }] }
      : {}),
    type: 'message',
  };
}

const mockRequests: RequestSummary[] = [
  {
    id: 'ticket_1',
    title: '#R1 Tour booking platform sync issues',
    status: RequestStatus.TODO,
    priority: 3,
    customer: {
      id: 'customer_1',
      fullName: mockCustomers['customer_1']?.fullName ?? 'Unknown Customer',
    },
    updatedAt: {
      iso8601: generateTimestampForRequest(1),
    },
    previewText:
      'Our tour dates are not syncing properly with the booking platform after the recent update.',
  },
  {
    id: 'ticket_2',
    title: '#R2 Recording software payment processing',
    status: RequestStatus.IN_PROGRESS,
    priority: 2,
    customer: {
      id: 'customer_2',
      fullName: mockCustomers['customer_2']?.fullName ?? 'Unknown Customer',
    },
    updatedAt: {
      iso8601: generateTimestampForRequest(2),
    },
    previewText: 'Payment failed twice for our recording software subscription renewal.',
  },
  {
    id: 'ticket_3',
    title: '#R3 Venue acoustic analysis feature',
    status: RequestStatus.TODO,
    priority: 1,
    customer: {
      id: 'customer_3',
      fullName: mockCustomers['customer_3']?.fullName ?? 'Unknown Customer',
    },
    updatedAt: {
      iso8601: generateTimestampForRequest(3),
    },
    previewText:
      'Would like to request an acoustic analysis feature for venue selection in the platform.',
  },
  {
    id: 'ticket_4',
    title: '#R4 Streaming royalty data missing',
    status: RequestStatus.TODO,
    priority: 2,
    customer: {
      id: 'customer_1',
      fullName: mockCustomers['customer_1']?.fullName ?? 'Unknown Customer',
    },
    updatedAt: {
      iso8601: generateTimestampForRequest(4),
    },
    previewText:
      'The streaming royalty reports are missing data from Spotify and Apple Music for last month.',
  },
  {
    id: 'ticket_5',
    title: '#R5 Concert livestream keeps disconnecting',
    status: RequestStatus.IN_PROGRESS,
    priority: 3,
    customer: {
      id: 'customer_2',
      fullName: mockCustomers['customer_2']?.fullName ?? 'Unknown Customer',
    },
    updatedAt: {
      iso8601: generateTimestampForRequest(5),
    },
    previewText: 'The livestream keeps disconnecting during our concert broadcasts.',
  },
  {
    id: 'ticket_6',
    title: '#R6 Setlist backup not working',
    status: RequestStatus.DONE,
    priority: 2,
    customer: {
      id: 'customer_3',
      fullName: mockCustomers['customer_3']?.fullName ?? 'Unknown Customer',
    },
    updatedAt: {
      iso8601: generateTimestampForRequest(6),
    },
    previewText: 'Setlist backup functionality stopped working after the last app update.',
  },
  {
    id: 'ticket_7',
    title: '#R7 Music distributor API integration',
    status: RequestStatus.TODO,
    priority: 1,
    customer: {
      id: 'customer_1',
      fullName: mockCustomers['customer_1']?.fullName ?? 'Unknown Customer',
    },
    updatedAt: {
      iso8601: generateTimestampForRequest(7),
    },
    previewText: 'Need API integration with DistroKid for automated music distribution workflow.',
  },
  {
    id: 'ticket_8',
    title: '#R8 Band collaboration sync delays',
    status: RequestStatus.IN_PROGRESS,
    priority: 2,
    customer: {
      id: 'customer_2',
      fullName: mockCustomers['customer_2']?.fullName ?? 'Unknown Customer',
    },
    updatedAt: {
      iso8601: generateTimestampForRequest(8),
    },
    previewText: 'File sync between band members is taking too long during recording sessions.',
  },
  {
    id: 'ticket_9',
    title: '#R9 Fan email list export feature',
    status: RequestStatus.TODO,
    priority: 1,
    customer: {
      id: 'customer_3',
      fullName: mockCustomers['customer_3']?.fullName ?? 'Unknown Customer',
    },
    updatedAt: {
      iso8601: generateTimestampForRequest(9),
    },
    previewText: 'Need ability to export fan email lists in CSV format for newsletter campaigns.',
  },
];

/**
 * Generate timeline entries for a ticket using faker
 */
function createFakerTimelineEntries(
  requestId: string,
  customer: CustomerData,
  count: number = 5
): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  for (let i = 1; i <= count; i++) {
    entries.push(generateFakeTimelineEntry(requestId, i, customer));
  }
  return entries;
}

/**
 * Get paginated requests with optional filtering
 * For newest-first ordering, we generate tickets in reverse order
 *
 * @param page - Current page number (1-based)
 * @param limit - Number of items per page
 * @param totalMockItems - Total number of mock items to generate
 * @param status - Optional status filter
 * @returns Paginated response with correct ticket count
 */
export function getMockRequests(
  page: number = 1,
  limit: number = 10,
  totalMockItems: number = 22,
  status?: RequestStatus
): RequestsResponse {
  let requests: RequestSummary[] = [];

  const startRequestNumber = totalMockItems - (page - 1) * limit;
  const endRequestNumber = Math.max(1, startRequestNumber - limit + 1);

  for (let requestNumber = startRequestNumber; requestNumber >= endRequestNumber; requestNumber--) {
    const ticketId = `ticket_${requestNumber}`;

    const existingRequest = mockRequests.find((r) => r.id === ticketId);
    if (existingRequest) {
      requests.push(existingRequest);
    } else {
      requests.push(generateFakeTicketSummary(ticketId, requestNumber));
    }
  }

  if (status) {
    requests = requests.filter((r) => r.status === status);
  }

  const pagination: PageInfo = {
    page: page,
    limit,
    total: totalMockItems,
    hasNextPage: page * limit < totalMockItems,
    hasPreviousPage: page > 1,
    currentPage: page,
    totalPages: Math.ceil(totalMockItems / limit),
    totalItems: totalMockItems,
  };

  const customerDataMap = { ...mockCustomers };

  requests.forEach((req) => {
    const customerId = req.customer.id;
    if (customerId && !customerDataMap[customerId]) {
      customerDataMap[customerId] = getCustomerById(customerId);
    }
  });

  return {
    success: true,
    tickets: requests.map((req) => ({
      id: req.id,
      title: req.title || 'Untitled Request',
      status: req.status as RequestStatus,
      priority: req.priority,
      customer: req.customer,
      updatedAt: req.updatedAt,
      createdAt: req.updatedAt,
      previewText: req.previewText || 'No preview available',
    })),
    pagination: pagination,
    customerDataMap: customerDataMap,
  };
}

/**
 * Get detailed information for a specific request
 *
 * @param requestId - Request ID to retrieve
 * @param timelineLimit - Maximum number of timeline entries to include
 * @returns Request detail response or null if not found
 */
export function getMockRequestDetail(
  requestId: string,
  timelineLimit: number = 5
): RequestDetailResponse | null {
  // First, try to find the request in the static array
  const existingRequest = mockRequests.find((r) => r.id === requestId);

  if (existingRequest) {
    const customer = getCustomerById(existingRequest.customer.id);
    const timelineEntries = createFakerTimelineEntries(requestId, customer, timelineLimit);

    return {
      request: {
        id: existingRequest.id,
        title: existingRequest.title || undefined,
        status: existingRequest.status as RequestStatus,
        priority: existingRequest.priority,
        customer: {
          id: customer.id,
          fullName: customer.fullName,
        },
        updatedAt: existingRequest.updatedAt,
        createdAt: existingRequest.updatedAt,
        timelineEntries: {
          items: timelineEntries,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            currentPage: 1,
            totalPages: 1,
            totalItems: timelineEntries.length,
          },
        },
      },
      timeline: {
        timelineEntries: {
          items: timelineEntries,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            currentPage: 1,
            totalPages: 1,
            totalItems: timelineEntries.length,
          },
        },
      },
    } as RequestDetailResponse;
  }

  const requestNumber = Number(requestId.replace(/[^0-9]/g, '')) || 1;

  if (requestNumber < 1 || requestNumber > 22) {
    return null;
  }

  const fakeTicketSummary = generateFakeTicketSummary(requestId, requestNumber);
  const customer = getCustomerById(fakeTicketSummary.customer.id);
  const timelineEntries = createFakerTimelineEntries(requestId, customer, timelineLimit);

  return {
    request: {
      id: fakeTicketSummary.id,
      title: fakeTicketSummary.title,
      status: fakeTicketSummary.status as RequestStatus,
      priority: fakeTicketSummary.priority,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
      },
      updatedAt: fakeTicketSummary.updatedAt,
      createdAt: fakeTicketSummary.updatedAt,
      timelineEntries: {
        items: timelineEntries,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          currentPage: 1,
          totalPages: 1,
          totalItems: timelineEntries.length,
        },
      },
    },
    timeline: {
      timelineEntries: {
        items: timelineEntries,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          currentPage: 1,
          totalPages: 1,
          totalItems: timelineEntries.length,
        },
      },
    },
  } as RequestDetailResponse;
}
