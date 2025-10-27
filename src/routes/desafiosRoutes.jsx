import React from "react";
import { Routes, Route } from "react-router-dom";
import ChallengesPage from "../pages/ChallengesPage";
import ChallengeDetail from "../pages/ChallengeDetail";
import { ParticipatePage } from "../pages/ParticipatePage";


export default function DesafiosRoutes() {
return (
<Routes>
<Route path="/desafios" element={<ChallengesPage />} />
<Route path="/desafios/:id" element={<ChallengeDetail />} />
<Route path="/desafios/:id/participar" element={<ParticipatePage />} />
</Routes>
);
}

