# SplitSmart Requirements Inventory

## 1. Purpose
SplitSmart is an expense-sharing system designed for
individuals and groups, including roommates, friends,
family members, and coworkers.

This document summarizes the original customer
requirements from UserRequirement.md.

## 2. Customer Requirements

| ID | Requirement | Description |
|---|---|---|
| FR-001 | User Accounts | Users can create accounts, log in, and access personal expense and balance information. |
| FR-002 | Group Management | Users can create and manage groups for shared expenses. |
| FR-003 | Expense Creation | Users can record expenses with amount, date, description, split method, optional receipt, and participants. |
| FR-004 | Notifications | Users receive notifications when group members create expenses. |
| FR-005 | Approval Workflow | Expenses require review and approval before affecting balances. |
| FR-006 | Payment Tracking | Users can record payments used to settle outstanding balances. |
| FR-007 | Balance Tracking | The system tracks amounts owed between users. |
| FR-008 | Reporting | Users can access expense, balance, and payment reports. |
| FR-009 | Platform Support | The complete system supports web, Android, and iOS platforms. |

## 3. Java Swing MVP

The course implementation uses Java 21, Maven,
Java Swing, JUnit 5, and PlantUML.

The MVP focuses on:
- User accounts
- Group management
- Expense creation
- Balance tracking

The full customer requirements remain in scope for
the overall SplitSmart product.

## 4. Open Clarifications

Nine ambiguities have been identified, including
expense payers, membership management, rounding,
validation, percentage splits, authentication,
notifications, approvals, and settlements.

All proposed resolutions are awaiting customer
confirmation.

See specs/spec.md for detailed clarification records.

## 5. Traceability

- Original customer request: UserRequirement.md
- Engineering principles: .specify/memory/constitution.md
- Feature specification: specs/spec.md

All implementation decisions must remain distinguishable
from the original customer requirements.