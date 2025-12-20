# Design Guidelines for Gmail Email Outreach System

## Design Approach
**System**: Custom functional application design - productivity-focused email management tool
**Justification**: This is a utility-focused application where efficiency, clarity, and workflow optimization are paramount. The design prioritizes information density, clear hierarchy, and professional aesthetics suitable for a business productivity tool.

## Core Design Elements

### A. Typography
- **Font Family**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **Font Sizes**:
  - Base: 14px (body text, form inputs, labels)
  - Large: 16px (headings, primary buttons)
  - Small: 12px (timestamps, metadata, helper text)
- **Weights**: Regular (400) for body, Medium (500) for labels, Semibold (600) for headings and buttons

### B. Layout System
**Tailwind Spacing Units**: Use consistent spacing scale of 2, 4, 6, 8, 12, 16, 24
- Header height: 60px (h-15 equivalent)
- Tab navigation: 50px (h-12 equivalent)
- Padding small: 8px (p-2)
- Padding medium: 16px (p-4)
- Padding large: 24px (p-6)
- Form field spacing: 16px (space-y-4)
- Section gaps: 24px (gap-6)

**Main Layout Structure**:
- Fixed header at top (sticky)
- Tab navigation bar below header (sticky)
- Content area with two-column split on Compose tab (45% left / 55% right)
- Full-width single column on Sent Emails and Settings tabs

### C. Color Palette
- **Background**: #FFFFFF (white)
- **Sidebar/Secondary Background**: #F9FAFB (very light gray)
- **Border**: #E5E7EB (light gray borders)
- **Text Primary**: #111827 (near black)
- **Text Secondary**: #6B7280 (medium gray)
- **Button Primary**: #3B82F6 (blue)
- **Button Hover**: #2563EB (darker blue)
- **Status Indicators**:
  - Green (Replied): #10B981
  - Red (No Reply): #EF4444
  - Yellow (Follow-up Sent): #F59E0B

### D. Component Library

**Header**:
- White background with light gray bottom border
- Logo/title on left (text-lg, font-semibold)
- Gmail connection status on right with checkmark icon
- Horizontal padding: 24px

**Tab Navigation**:
- Three tabs: "Compose & Send", "Sent Emails", "Settings"
- Inactive tabs: gray text, white background
- Active tab: blue text, white background, blue bottom border (2px)
- Tab padding: 12px horizontal, 16px vertical

**Forms**:
- Input fields: white background, gray border, rounded corners (4px), 16px padding
- Labels: medium weight, text-sm, gray color, 8px bottom margin
- Textareas: minimum height 200px for compose area
- Buttons: rounded corners (6px), 12px vertical padding, 24px horizontal padding

**Contact Queue Chips**:
- Pills with light gray background
- Contact name and company displayed
- X button on right for removal
- Checkboxes for selection
- 8px margin between chips

**Email Preview Cards**:
- Light gray background (#F9FAFB)
- 16px padding
- 8px border radius
- Email recipient (bold), subject (regular), preview of body (gray text)
- Edit button (small, secondary style)

**Sent Email List Items**:
- Single-line rows with hover state (light gray background on hover)
- Layout: Name (bold) | Company | Email | Timestamp | Status Icon
- Expandable to show full details
- Border between items
- Padding: 16px vertical, 24px horizontal

**Modal (Follow-up)**:
- 600px width, centered
- White background with shadow
- Close button in top right
- Original email shown in gray box (read-only)
- New textarea for follow-up message
- Primary action button at bottom

**Status Indicators**:
- Circular colored dots (8px diameter) before status text
- Green: "REPLIED"
- Red: "No Reply"  
- Yellow: "Follow-up Sent"

**Buttons**:
- Primary: Blue background, white text, hover darkens
- Secondary: White background, gray border, gray text
- Large action buttons (Send All Emails): extra padding, prominent placement
- Icon buttons: minimal padding, no background, hover shows light gray

**Data Tables/Lists**:
- Alternating row backgrounds optional
- Clear borders between rows
- Sortable headers where applicable
- Pagination at bottom if needed

## Accessibility & Interaction
- Focus states: blue outline on all interactive elements
- Clear hover states for all clickable items
- Loading states: spinner or progress bar for email sending
- Toast notifications: appear top-right, auto-dismiss after 5 seconds
- Confirm modals for destructive actions ("Send X emails now?")

## Page-Specific Guidelines

**Compose & Send Tab**:
- Two-column layout with visible divider
- Left column scrollable for long contact lists
- Right column fixed compose area at top, scrollable preview area below
- Radio buttons for writing style selection
- Generate button between compose and preview areas

**Sent Emails Tab**:
- Full-width list view
- Newest first sorting
- Expand/collapse functionality per row
- Timestamp displays relative time (minutes/hours ago) or absolute date
- Follow-up button only visible in expanded state

**Settings Tab**:
- Single column, centered, max-width 600px
- Grouped sections with headings
- Status indicators for connection states
- Masked API key input with reveal option
- Dropdown for auto-check interval

## Animation & Transitions
- Minimal animations - focus on instant feedback
- Tab switching: instant, no transition
- Expand/collapse: 200ms ease transition
- Toast notifications: slide in from right
- Button loading: spinner replaces text
- No decorative animations