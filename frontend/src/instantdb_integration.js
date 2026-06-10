/**
 * EarnHub - Instant DB & Cloudinary Backend Integration and Functional Logic Script
 * 
 * This file contains the complete integration logic, device fingerprinting,
 * graph-based referral model, secure Cloudinary uploads, CPA postback simulation,
 * and admin delegation workflows.
 * 
 * To integrate into any vanilla HTML website, include this module via:
 * <script src="./src/instantdb_integration.js"></script>
 */

// Global config namespace
const EarnHubIntegrationConfig = {
  INSTANT_DB_APP_ID: "77f79e7c-c9de-4202-903c-eb3e92477f79", // Placeholder App ID
  CLOUDINARY_CLOUD_NAME: "earnhub_prod",
  CLOUDINARY_UPLOAD_PRESET: "earnhub_unverified_task_proofs",
  REFERRAL_PASSIVE_COMMISSION_PCT: 0.10, // 10% indirect sponsor commission
  AD_NETWORK_SHARED_SECRET: "cpa_lead_secure_hmac_secret_2026"
};

// --- 1. INSTANT DB INITIALIZATION & AUTH PIPELINE ---

/**
 * Lazy-initializer helper to get the InstantDB Client Instance
 * Uses the global InstantDB script if loaded in header, or falls back to standard schema structure.
 */
function getInstantDBClient() {
  if (typeof window !== 'undefined' && window.instantdb) {
    return window.instantdb.init({ appId: EarnHubIntegrationConfig.INSTANT_DB_APP_ID });
  } else {
    // Return mock interface for development environments if not fully imported on window yet
    console.warn("InstantDB SDK not found on window object. Utilizing structured simulation sandbox interface.");
    return createInstantDBSandbox();
  }
}

/**
 * Advanced Device Fingerprinting Engine
 * Generates an extremely stable device node signature to strictly curb multi-account sybil attacks.
 */
async function generateDeviceFingerprint() {
  try {
    const components = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      colorDepth: screen.colorDepth,
      devicePixelRatio: window.devicePixelRatio,
      timezoneOffset: new Date().getTimezoneOffset(),
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
      deviceMemory: navigator.deviceMemory || 4,
      screenResolution: `${screen.width}x${screen.height}`,
      availableResolution: `${screen.availWidth}x${screen.availHeight}`,
      touchSupport: 'maxTouchPoints' in navigator ? navigator.maxTouchPoints : 0
    };

    // Canvas rendering anomaly fingerprinting
    let canvasHash = "";
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 200;
        canvas.height = 50;
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125,1,62,20);
        ctx.fillStyle = "#069";
        ctx.fillText("EarnHub_Integrity_Verify_2026", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("EarnHub_Integrity_Verify_2026", 4, 17);
        canvasHash = canvas.toDataURL();
      }
    } catch (e) {
      canvasHash = "canvas-blocked";
    }
    components.canvas = canvasHash;

    // Local permanent client token node seeding
    let clientNodeToken = localStorage.getItem('eh_node_anchor');
    if (!clientNodeToken) {
      clientNodeToken = 'NODE_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('eh_node_anchor', clientNodeToken);
    }
    components.anchor = clientNodeToken;

    // Convert component blocks into serialized string buffer
    const rawBufferString = JSON.stringify(components);
    const msgUint8 = new TextEncoder().encode(rawBufferString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    
    // Create direct hex output
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error("Failed to generate robust fingerprint, reverting to high-entropy backup locator:", error);
    return 'FNGR_' + (Math.random() * 1e18).toString(36);
  }
}

/**
 * User Authentication Pipeline (Signup/Login)
 */
class EarnHubAuthPipeline {
  constructor(dbClient) {
    this.db = dbClient;
  }

  /**
   * Action trigger for secure client signups
   */
  async signup({ email, password, firstName, lastName, sponsorCode = null }) {
    if (!email || !password || !firstName || !lastName) {
      throw new Error("Required field parameters missing for user account registration.");
    }

    const deviceFingerprint = await generateDeviceFingerprint();

    // Check device double signup lock restriction
    const duplicateAccounts = await this.db.query({
      users: {
        $: {
          where: { deviceFingerprint: deviceFingerprint }
        }
      }
    });

    if (duplicateAccounts && duplicateAccounts.users && duplicateAccounts.users.length > 0) {
      throw new Error("Security Lock: Multiple account registrations from this devices are strictly prohibited.");
    }

    const userId = "USR_" + Math.random().toString(36).substring(2, 9).toUpperCase();
    const newUserRecord = {
      id: userId,
      email: email.trim().toLowerCase(),
      fname: firstName,
      lname: lastName,
      points: 100, // Starting legacy bonus points
      deviceFingerprint: deviceFingerprint,
      createdAt: new Date().toISOString(),
      suspended: false
    };

    // Begin Instant DB Database State Transaction
    await this.db.transact([
      this.db.tx.users[userId].update(newUserRecord)
    ]);

    // Handle referral attachment if a sponsor code exists
    if (sponsorCode) {
      await establishReferralLink(userId, sponsorCode);
    }

    // Set local authentication state
    localStorage.setItem('eh_logged_userId', userId);
    return newUserRecord;
  }

  /**
   * Action trigger for normal user session login
   */
  async login(email, password) {
    const userResult = await this.db.query({
      users: {
        $: {
          where: { email: email.trim().toLowerCase() }
        }
      }
    });

    if (!userResult || !userResult.users || userResult.users.length === 0) {
      throw new Error("Invalid username/email password credentials.");
    }

    const user = userResult.users[0];
    if (user.suspended) {
      throw new Error("This profile account has been suspended indefinitely due to service violation terms.");
    }

    // Re-verify current browser node integrity
    const currentFingerprint = await generateDeviceFingerprint();
    if (user.deviceFingerprint !== currentFingerprint) {
      console.warn("Session device identity mismatch. Recording login location shifting event.");
      await this.db.transact([
        this.db.tx.users[user.id].update({ lastDeviceShiftingAlert: new Date().toISOString() })
      ]);
    }

    localStorage.setItem('eh_logged_userId', user.id);
    return user;
  }
}


// --- 2. DUAL-LEVEL REFERRAL TREE LOGIC (GRAPH MODEL) ---

/**
 * Resolves referrers and ensures cyclic security rules are perfectly preserved.
 * Implements full path containment checking up the graph model.
 */
async function establishReferralLink(childUserId, sponsorUserId) {
  const db = getInstantDBClient();

  if (childUserId === sponsorUserId) {
    throw new Error("Self-referrals are strictly disallowed.");
  }

  // Ensure sponsor user actually exists
  const sponsorLookup = await db.query({
    users: {
      $: { where: { id: sponsorUserId } }
    }
  });

  if (!sponsorLookup || !sponsorLookup.users || sponsorLookup.users.length === 0) {
    throw new Error(`Sponsor user code ${sponsorUserId} does not point to a registered member.`);
  }

  // Prevent parent link duplication
  const existingParentCheck = await db.query({
    users: {
      $: { where: { id: childUserId } },
      sponsor: {} // Graph link reference expansion
    }
  });

  if (existingParentCheck && existingParentCheck.users && existingParentCheck.users[0]?.sponsor?.length > 0) {
    throw new Error("Verification Failed: User relationship already linked to another sponsor node.");
  }

  // Multi-Level Cycle Guard Check (Verify B doesn't refer A then A refers B)
  let currentTargetId = sponsorUserId;
  const visitedNodeSet = new Set([childUserId]);

  while (currentTargetId) {
    if (visitedNodeSet.has(currentTargetId)) {
      throw new Error("Cyclic Loop Detected: Outbound referral loop is mathematically forbidden in graph trees.");
    }
    visitedNodeSet.add(currentTargetId);

    // Recursively query sponsor parent lineage
    const pathTrace = await db.query({
      users: {
        $: { where: { id: currentTargetId } },
        sponsor: {}
      }
    });

    const parentNode = pathTrace?.users?.[0]?.sponsor?.[0];
    currentTargetId = parentNode ? parentNode.id : null;
  }

  // Graph Transaction: Define links in InstantDB triple catalog
  await db.transact([
    db.tx.users[childUserId].link({ sponsor: sponsorUserId }),
    db.tx.users[sponsorUserId].link({ referrals: childUserId })
  ]);

  console.log(`Successfully linked User ${childUserId} to Sponsor Node Parent: ${sponsorUserId}`);
}

/**
 * Dynamic Multi-Level Passive Network Real-time Listener Engine
 */
function watchReferralPassiveRewards(userId, onUpdateCallback) {
  const db = getInstantDBClient();

  // Watch full graph traversal starting from active user node
  db.subscribe({
    users: {
      $: { where: { id: userId } },
      referrals: { // Tier 1 relationships
        referrals: {} // Tier 2 relationships
      }
    }
  }, (response) => {
    if (response.error) {
      console.error("Passive Referral Graph monitor error:", response.error);
      return;
    }

    const selfProfile = response.data?.users?.[0];
    if (!selfProfile) return;

    const directReferrals = selfProfile.referrals || [];
    const directCount = directReferrals.length;

    // Map Tier 2 children nodes
    let indirectCount = 0;
    const tier2List = [];
    directReferrals.forEach(t1 => {
      if (t1.referrals) {
        indirectCount += t1.referrals.length;
        tier2List.push(...t1.referrals);
      }
    });

    const summaryReport = {
      level1Count: directCount,
      level2Count: indirectCount,
      totalGraphNetworkCount: directCount + indirectCount,
      level1Members: directReferrals.map(u => ({ id: u.id, fname: u.fname, lname: u.lname, activePoints: u.points })),
      level2Members: tier2List.map(u => ({ id: u.id, fname: u.fname, lname: u.lname, activePoints: u.points }))
    };

    onUpdateCallback(summaryReport);
  });
}


// --- 3. MICRO-TASK & CLOUDINARY INTEGRATION ---

/**
 * Handle HTML File Input Form triggers
 */
async function processTaskProofSubmission({ fileInputId, taskId }) {
  const inputElement = document.getElementById(fileInputId);
  if (!inputElement || !inputElement.files || inputElement.files.length === 0) {
    throw new Error("No screen capture image selected for upload verification.");
  }

  const userId = localStorage.getItem('eh_logged_userId');
  if (!userId) {
    throw new Error("No active logged-in session found.");
  }

  const selectedFile = inputElement.files[0];
  console.log(`Preparing task target ${taskId} with attachment proof file Name: ${selectedFile.name}`);

  // Initiate Unsigned Cloudinary Secure Uplink
  const attachmentUrl = await uploadBlobToCloudinary(selectedFile);

  // Send Submission Node to InstantDB
  const db = getInstantDBClient();
  const submissionId = "SUB_" + Math.random().toString(36).substring(2, 11).toUpperCase();

  await db.transact([
    db.tx.taskSubmissions[submissionId].update({
      id: submissionId,
      userId: userId,
      taskId: taskId,
      proofAttachmentUrl: attachmentUrl,
      status: "Pending Verification",
      createdAt: new Date().toISOString()
    }),
    db.tx.users[userId].link({ submissions: submissionId }),
    db.tx.tasks[taskId].link({ submissions: submissionId })
  ]);

  return { submissionId, proofAttachmentUrl: attachmentUrl };
}

/**
 * Performs raw boundary packet uploads to Cloudinary Media Servers
 */
async function uploadBlobToCloudinary(fileBlob) {
  const url = `https://api.cloudinary.com/v1_1/${EarnHubIntegrationConfig.CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  const packagePayload = new FormData();
  packagePayload.append("file", fileBlob);
  packagePayload.append("upload_preset", EarnHubIntegrationConfig.CLOUDINARY_UPLOAD_PRESET);
  packagePayload.append("folder", "micro_task_proofs_delivery");

  const response = await fetch(url, {
    method: "POST",
    body: packagePayload
  });

  if (!response.ok) {
    const errorLog = await response.json();
    throw new Error(`Cloudinary upload sequence aborted (HTTP ${response.status}): ${errorLog.error?.message || "Internal failure"}`);
  }

  const resolvedBody = await response.json();
  return resolvedBody.secure_url; // Verified permanent HTTPS anchor link
}

/**
 * CPA Offerwall Query Param Dynamic Injector
 */
function integrateOfferwallIframe(iframeElementId, cpaUrlBase) {
  const userId = localStorage.getItem('eh_logged_userId');
  const targetIframe = document.getElementById(iframeElementId);

  if (!targetIframe) {
    console.error(`Target iframe with node ID '${iframeElementId}' could not be located in HTML registry.`);
    return;
  }

  if (!userId) {
    targetIframe.src = "about:blank";
    console.warn("Iframe injection deferred. Client needs to authenticate.");
    return;
  }

  // Append user transaction ID as tracking subid parameters
  const resolvedCpaUrl = new URL(cpaUrlBase);
  resolvedCpaUrl.searchParams.set("subid", userId);
  resolvedCpaUrl.searchParams.set("timestamp", Date.now().toString());

  targetIframe.src = resolvedCpaUrl.toString();
  console.log(`CPA Offerwall initialized securely with User ID tracking: ${resolvedCpaUrl}`);
}


// --- 4. SERVERLESS WEBHOOK / POSTBACK ENDPOINT SIMULATION ---

/**
 * Simulates the ad network (such as CPAlead or Monlix) sending a postback request
 * indicating a user has successfully finished an offerwall campaign.
 */
async function simulatePostbackWebhookCallback({ queryParams }) {
  const { subid, points, status, signature } = queryParams;

  console.log("Incoming serverless postback webhook request received:", queryParams);

  // Signature verification to block fraudulent API execution
  const expectedContentString = `${subid}:${points}:${status}:${EarnHubIntegrationConfig.AD_NETWORK_SHARED_SECRET}`;
  const localSignatureBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(expectedContentString));
  const localSignature = Array.from(new Uint8Array(localSignatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  if (signature !== localSignature) {
    throw new Error("Postback Security Failure: Signature hash mismatch. Dropping webhook packet payload.");
  }

  if (status !== 'success') {
    throw new Error(`Ad Network Task Status is non-success (${status}). Mutation execution ignored.`);
  }

  const db = getInstantDBClient();

  // Inspect database to fetch user account
  const user = await db.query({
    users: {
      $: { where: { id: subid } }
    }
  });

  if (!user || user.users.length === 0) {
    throw new Error(`Target Lead User not identified in database records [ID: ${subid}].`);
  }

  const targetUser = user.users[0];
  const incrementalPoints = parseInt(points, 10);
  const updatedPointsSum = (targetUser.points || 0) + incrementalPoints;

  const transactionLedgerId = "TX_" + Date.now();

  // Atomic database state adjustments
  await db.transact([
    db.tx.users[subid].update({ points: updatedPointsSum }),
    db.tx.transactions[transactionLedgerId].update({
      id: transactionLedgerId,
      userId: subid,
      amount: incrementalPoints,
      type: "CPA Offerwall Conversion Reward",
      timestamp: new Date().toISOString()
    })
  ]);

  console.log(`Webhook payout processed successfully! Credited ₹${incrementalPoints} to candidate: ${subid}`);
  return { success: true, newBalance: updatedPointsSum };
}


// --- 5. ADMIN OPERATIONS & REFERRAL COMMISSION BONUS PIPELINE ---

/**
 * Event triggers to be bound to Admin Portal actions
 */
class EarnHubAdminControlDashboard {
  constructor(db) {
    this.db = db;
  }

  /**
   * Main Task Approval Pipeline
   * Resolves the micro-task work, credits candidate points, and propagates child-sponsor passive commissions.
   */
  async approveTaskProof(submissionId, adminActionNote = "Verification confirmed.") {
    console.log(`[Admin Control] Starting verification lookup routine for submission: ${submissionId}`);

    // Retrieve Task proof details along with user node and relational mappings
    const submissionSet = await this.db.query({
      taskSubmissions: {
        $: { where: { id: submissionId } }
      }
    });

    const activeSubmission = submissionSet?.taskSubmissions?.[0];
    if (!activeSubmission) {
      throw new Error(`Invalid submission record UID ${submissionId}`);
    }

    if (activeSubmission.status !== "Pending Verification") {
      throw new Error(`Integrity Lock: Action revoked. Task is already marked '${activeSubmission.status}'`);
    }

    const workerId = activeSubmission.userId;
    const taskId = activeSubmission.taskId;

    // Retrieve campaign reward payout parameter
    const taskDetails = await this.db.query({
      tasks: {
        $: { where: { id: taskId } }
      }
    });

    const activeTask = taskDetails?.tasks?.[0];
    if (!activeTask) {
      throw new Error(`Parent task node campaign #${taskId} does not exist.`);
    }

    const taskRewardAmount = activeTask.pointsValue || 200; // Standby default reward

    // Fetch worker baseline stats
    const workerProfile = await this.db.query({
      users: {
        $: { where: { id: workerId } },
        sponsor: {} // Map direct parent graph relation
      }
    });

    const activeWorker = workerProfile?.users?.[0];
    if (!activeWorker) {
      throw new Error(`Submitting worker profile account [${workerId}] has been deleted.`);
    }

    const updatedWorkerBalance = (activeWorker.points || 0) + taskRewardAmount;
    const workerTransactionId = "TXW_" + Date.now();

    // Prepare transaction instruction queue
    const databaseTransactionStatements = [
      this.db.tx.taskSubmissions[submissionId].update({
        status: "Approved",
        adminComments: adminActionNote,
        resolvedAt: new Date().toISOString()
      }),
      this.db.tx.users[workerId].update({
        points: updatedWorkerBalance
      }),
      this.db.tx.transactions[workerTransactionId].update({
        id: workerTransactionId,
        userId: workerId,
        amount: taskRewardAmount,
        type: `Completed Micro Campaign task: ${activeTask.title || "EarnHub Core Campaign"}`,
        timestamp: new Date().toISOString()
      })
    ];

    // --- Graph Sponsor Passive Commission Cascade Trigger ---
    const directSponsorNode = activeWorker.sponsor?.[0];
    if (directSponsorNode) {
      const sponsorId = directSponsorNode.id;
      const commissionEarnedPoints = Math.floor(taskRewardAmount * EarnHubIntegrationConfig.REFERRAL_PASSIVE_COMMISSION_PCT);
      
      const sponsorLatestStats = await this.db.query({
        users: {
          $: { where: { id: sponsorId } }
        }
      });
      
      const sponsorRecord = sponsorLatestStats?.users?.[0];
      if (sponsorRecord && !sponsorRecord.suspended) {
        const updatedSponsorBalance = (sponsorRecord.points || 0) + commissionEarnedPoints;
        const commissionLedgerTxId = "TXR_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5);

        // Queue Sponsor Referral Credit Mutations
        databaseTransactionStatements.push(
          this.db.tx.users[sponsorId].update({
            points: updatedSponsorBalance
          }),
          this.db.tx.transactions[commissionLedgerTxId].update({
            id: commissionLedgerTxId,
            userId: sponsorId,
            amount: commissionEarnedPoints,
            type: `10% Passive Sponsor Override Commission (Referred: ${activeWorker.fname})`,
            timestamp: new Date().toISOString()
          })
        );
        console.log(`Cascade: Queued passive referral commission credit [${commissionEarnedPoints} points] to Sponsor Parent: ${sponsorId}`);
      }
    } else {
      console.log(`Worker ${workerId} has no parent referral sponsor. Referral override commission bypass triggered.`);
    }

    // Execute mutations inside a single robust atomic database transaction block
    await this.db.transact(databaseTransactionStatements);

    console.log(`[Admin Control] Submission #${submissionId} successfully resolved, balances updated.`);
    return { success: true, updatedWorkerPoints: updatedWorkerBalance };
  }

  /**
   * Rejects incoming submission proof and rolls back point transitions
   */
  async rejectTaskProof(submissionId, reasonValue) {
    if (!reasonValue || reasonValue.trim() === "") {
      throw new Error("Admin must state a concrete rejection reason to prevent arbitrariness.");
    }

    const submissionSet = await this.db.query({
      taskSubmissions: {
        $: { where: { id: submissionId } }
      }
    });

    const activeSubmission = submissionSet?.taskSubmissions?.[0];
    if (!activeSubmission) {
      throw new Error(`Invalid submission ID`);
    }

    if (activeSubmission.status !== "Pending Verification") {
      throw new Error(`Submission cannot be updated once locked inside state: ${activeSubmission.status}`);
    }

    await this.db.transact([
      this.db.tx.taskSubmissions[submissionId].update({
        status: "Rejected",
        adminComments: reasonValue,
        resolvedAt: new Date().toISOString()
      })
    ]);

    console.log(`[Admin Control] Submission ${submissionId} has been rejected.`);
    return { success: true };
  }
}


// --- INSTANT DB GRAPH SANDBOX EMULATOR ---
// Used gracefully as a safety sandbox if imported outside the active standard client setup environment

function createInstantDBSandbox() {
  const localRegistry = {
    users: {},
    tasks: {
      T001: { id: "T001", title: "Join Official Telegram Campaign", pointsValue: 350 },
      T002: { id: "T002", title: "Download Partner FinTech Utility", pointsValue: 1200 }
    },
    taskSubmissions: {},
    transactions: {}
  };

  return {
    tx: {
      users: {
        update: (fields) => ({ entity: 'users', action: 'update', fields }),
        link: (relation) => ({ entity: 'users', action: 'link', relation })
      },
      tasks: {
        update: (fields) => ({ entity: 'tasks', action: 'update', fields }),
        link: (relation) => ({ entity: 'tasks', action: 'link', relation })
      },
      taskSubmissions: {
        update: (fields) => ({ entity: 'taskSubmissions', action: 'update', fields }),
        link: (relation) => ({ entity: 'taskSubmissions', action: 'link', relation })
      },
      transactions: {
        update: (fields) => ({ entity: 'transactions', action: 'update', fields }),
        link: (relation) => ({ entity: 'transactions', action: 'link', relation })
      }
    },
    query: async function(pattern) {
      const entityName = Object.keys(pattern)[0];
      const constraint = pattern[entityName].$;
      const resultList = [];
      
      const table = localRegistry[entityName] || {};
      for (const id in table) {
        let matches = true;
        if (constraint?.where) {
          for (const key in constraint.where) {
            if (table[id][key] !== constraint.where[key]) {
              matches = false;
            }
          }
        }
        if (matches) {
          resultList.push(table[id]);
        }
      }
      return { [entityName]: resultList };
    },
    subscribe: function(pattern, callback) {
      // Simulate real-time update delivery block
      setTimeout(() => {
        callback({ data: { users: [] } });
      }, 50);
      return () => {};
    },
    transact: async function(statements) {
      statements.forEach(statement => {
        console.log("[Simulation DB Transaction Block]:", statement);
        // Emulate local updates
        const dbName = statement.entity;
        if (statement.action === 'update' && statement.fields?.id) {
          localRegistry[dbName][statement.fields.id] = {
            ...(localRegistry[dbName][statement.fields.id] || {}),
            ...statement.fields
          };
        }
      });
      return true;
    }
  };
}

// Export references for module architectures or legacy namespace registration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EarnHubIntegrationConfig,
    generateDeviceFingerprint,
    EarnHubAuthPipeline,
    establishReferralLink,
    watchReferralPassiveRewards,
    processTaskProofSubmission,
    uploadBlobToCloudinary,
    integrateOfferwallIframe,
    simulatePostbackWebhookCallback,
    EarnHubAdminControlDashboard
  };
} else {
  window.EarnHubEngine = {
    EarnHubIntegrationConfig,
    generateDeviceFingerprint,
    EarnHubAuthPipeline,
    establishReferralLink,
    watchReferralPassiveRewards,
    processTaskProofSubmission,
    uploadBlobToCloudinary,
    integrateOfferwallIframe,
    simulatePostbackWebhookCallback,
    EarnHubAdminControlDashboard
  };
}
