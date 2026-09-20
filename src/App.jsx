import React from 'react';
import { ScoutAppRoot } from './scout/ScoutApp.jsx';

/**
 * Geo-Farm Field Operations
 * SIH26131: Early detection & management of crop diseases and pest infestations
 *
 * This app was refactored from a farmer-facing government portal into a
 * dedicated Field Scout / Agriculture Student portal. The previous
 * farmer-oriented screens (HomePortal, GovSchemes, OfficerBooking,
 * OfficerDashboard, AlertCenter, GovHeader/GovFooter) are intentionally
 * no longer mounted here -- they belong to a separate farmer-facing
 * surface and a separate Agriculture Officer portal, per product
 * direction. Their component files are left in src/components/ in case
 * they're useful again, but this app boots straight into Field Scout
 * Operations (see src/scout/).
 */
export default function App() {
  return <ScoutAppRoot />;
}
