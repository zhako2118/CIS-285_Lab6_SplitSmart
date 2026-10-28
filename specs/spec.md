# SplitSmart Feature Specification

## 1. Overview
SplitSmart is a software solution for sharing expenses among individuals or groups, such as friends, roommates, family members, or coworkers. This specification outlines the functional and non-functional requirements, user scenarios, acceptance criteria, and traceability to the original customer requirements.

## 2. Actors and User Scenarios

### 2.1 Actors
- **User**: An individual who uses SplitSmart to manage personal or group expenses.
- **Group Admin**: A user who creates and manages groups, oversees group balances, and may have additional permissions (e.g., approving expenses).
- **System**: The SplitSmart application, which automates notifications, balance calculations, and reporting.

### 2.2 User Scenarios
1. **Scenario 1: Creating an Expense**
   - A user logs into their account, selects a group, and creates a new expense with details such as amount, date, description, shared manner (equal or percentage-based split), optional receipt image, and selected participants. The system adjusts balances accordingly.

2. **Scenario 2: Approving an Expense**
   - An approver reviews a submitted expense and approves or rejects it. Approved expenses are added to the system, and balances are updated.

3. **Scenario 3: Tracking Payments**
   - A user records a payment made to another user to settle a balance. The system updates the balances to reflect the payment.

4. **Scenario 4: Generating Reports**
   - A user generates a report summarizing expenses, balances, and payments for a specific date range.

5. **Scenario 5: Notifications**
   - Users receive notifications when a new expense is created, approved, or when a payment is recorded.

6. **Scenario 6: Managing Groups**
   - A user creates a group, adds members, and manages group settings.

## 3. Functional Requirements

### 3.1 Core Functional Requirements
- **FR-001**: The system shall allow users to create accounts and log in securely.  
  *Traceability*: UserRequirement.md - "User accounts"
- **FR-002**: The system shall allow users to create and manage groups.  
  *Traceability*: UserRequirement.md - "Group management"
- **FR-003**: The system shall allow users to create new expenses with the following details:
  - Amount (positive monetary value)
  - Date of the expense
  - Description of the expense
  - Shared manner (equal split or percentage-based split)
  - Optional receipt image
  - Selected participants involved in the expense  
  *Traceability*: UserRequirement.md - "Expense creation"
- **FR-004**: The system shall notify users when a new expense is created in their group.  
  *Traceability*: UserRequirement.md - "Notification system"
- **FR-005**: The system shall require expenses to be reviewed and approved before they affect balances.  
  *Traceability*: UserRequirement.md - "Approval workflow"
- **FR-006**: The system shall allow users to record payments made to settle balances.  
  *Traceability*: UserRequirement.md - "Payment tracking"
- **FR-007**: The system shall track balances owed by each user to every other user.  
  *Traceability*: UserRequirement.md - "Balance tracking"
- **FR-008**: The system shall generate reports summarizing expenses, balances, and payments, with options for custom date ranges.  
  *Traceability*: UserRequirement.md - "Reporting"
- **FR-009**: The system shall support web-based access and mobile apps for Android and iOS.  
  *Traceability*: UserRequirement.md - "OS supported"

### 3.2 MVP Functional Requirements (Java Swing)
- **FR-010**: The MVP shall implement a desktop GUI using Java Swing for expense creation, group management, and balance tracking.  
  *Traceability*: Constitution.md - "Java Swing as MVP"
- **FR-011**: The MVP shall allow users to create accounts, log in, and manage groups.  
  *Traceability*: Constitution.md - "Java Swing as MVP"
- **FR-012**: The MVP shall allow users to create expenses and track balances.  
  *Traceability*: Constitution.md - "Java Swing as MVP"

## 4. Non-Functional Requirements
- **NFR-001**: The system shall use BigDecimal for all monetary calculations to ensure precision.  
  *Traceability*: Constitution.md - "BigDecimal for monetary calculations"
- **NFR-002**: The system shall separate the GUI from the business logic to improve maintainability and scalability.  
  *Traceability*: Constitution.md - "Separation of GUI and business logic"
- **NFR-003**: The system shall adhere to object-oriented design principles.  
  *Traceability*: Constitution.md - "Object-oriented design"
- **NFR-004**: The system shall maintain traceability between customer requirements and implementation decisions.  
  *Traceability*: Constitution.md - "Requirement traceability"
- **NFR-005**: All AI-generated code or documentation shall undergo mandatory human review.  
  *Traceability*: Constitution.md - "Mandatory human review of AI-generated output"

## 5. Acceptance Criteria
- **Given** a user has logged in, **when** they create an expense with all required details, **then** the system shall adjust balances for all selected participants.
- **Given** a user has logged in, **when** they submit an expense for approval, **then** the system shall not adjust balances until the expense is approved.
- **Given** an approver reviews an expense, **when** they approve or reject it, **then** the system shall update the expense status and adjust balances only for approved expenses.
- **Given** a user has logged in, **when** they record a payment, **then** the system shall update balances to reflect the payment.
- **Given** a user has logged in, **when** they generate a report, **then** the system shall provide a summary of expenses, balances, and payments for the specified date range.
- The MVP shall implement expense creation, group management, and balance tracking using Java Swing.

## 6. Open Questions and Ambiguities
1. How should the system handle invalid amounts (e.g., negative or zero values)?
2. Should the system support multiple currencies, and if so, how should exchange rates be handled?
3. What specific notification methods (e.g., email, push notifications) are required for the web and mobile platforms?
4. Who is responsible for approving expenses in a group? Is it always the group admin, or can this role be delegated?
5. How should the system handle rounding errors in percentage-based splits?
6. What authentication methods are required for user accounts (e.g., password complexity, two-factor authentication)?
7. How should the system handle changes in group membership (e.g., adding or removing members)?
8. Should the system enforce that percentage totals for an expense must equal 100%?
9. How should balances be settled if a payment exceeds the amount owed?
10. How should the system distinguish between the payer of an expense and the participants who share its cost?

## 7. Requirement Traceability Matrix
| Requirement ID | Source Document | Description |
|----------------|-----------------|-------------|
| FR-001         | UserRequirement.md | User accounts |
| FR-002         | UserRequirement.md | Group management |
| FR-003         | UserRequirement.md | Expense creation |
| FR-004         | UserRequirement.md | Notification system |
| FR-005         | UserRequirement.md | Approval workflow |
| FR-006         | UserRequirement.md | Payment tracking |
| FR-007         | UserRequirement.md | Balance tracking |
| FR-008         | UserRequirement.md | Reporting |
| FR-009         | UserRequirement.md | OS supported |
| FR-010         | Constitution.md    | Java Swing MVP |
| FR-011         | Constitution.md    | Java Swing MVP |
| FR-012         | Constitution.md    | Java Swing MVP |

**Version**: 1.0.2 | **Ratified**: 2026-10-27

## 8. Clarifications

The following clarifications address ambiguities in the original requirements. These resolutions are proposed and awaiting customer confirmation:

1. **Who pays an expense versus who participates in splitting it?**  
   - **Proposed Resolution**: Explicitly identify the payer separately from the participants who share the expense.  
   - **Status**: Proposed — Awaiting Customer Confirmation

2. **How are group members added, removed, and managed?**  
   - **Proposed Resolution**: Allow group administrators to manage membership (add/remove members). When members leave, preserve historical expenses and outstanding balances to ensure data integrity.  
   - **Status**: Proposed — Awaiting Customer Confirmation

3. **How should monetary rounding be handled?**  
   - **Proposed Resolution**: Use BigDecimal for precise calculations and implement a deterministic rounding policy to ensure that allocated shares always equal the original expense amount.  
   - **Status**: Proposed — Awaiting Customer Confirmation

4. **What happens when users enter invalid or negative amounts?**  
   - **Proposed Resolution**: Reject zero, negative, and invalid expense amounts with clear validation error messages.  
   - **Status**: Proposed — Awaiting Customer Confirmation

5. **Must percentage splits total exactly 100%?**  
   - **Proposed Resolution**: Require percentage splits to total exactly 100% before allowing expense creation.  
   - **Status**: Proposed — Awaiting Customer Confirmation

6. **What authentication method should be supported?**  
   - **Proposed Resolution**: Use username/password authentication initially, with optional two-factor authentication (2FA) considered for future versions.  
   - **Status**: Proposed — Awaiting Customer Confirmation

7. **How and when should notifications be delivered?**  
   - **Proposed Resolution**: Use email notifications initially for all platforms. Consider implementing mobile push notifications in future versions.  
   - **Status**: Proposed — Awaiting Customer Confirmation

8. **Who can approve expenses, and how many approval levels are needed?**  
   - **Proposed Resolution**: Use single-level approval by group administrators initially. Consider configurable approval workflows in future versions.  
   - **Status**: Proposed — Awaiting Customer Confirmation

9. **How should balance settlement, partial payments, and overpayments work?**  
   - **Proposed Resolution**: Allow partial payments and update balances incrementally. Reject overpayments that exceed the outstanding balance.  
   - **Status**: Proposed — Awaiting Customer Confirmation