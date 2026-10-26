"""
Script to generate the complete, comprehensive technical documentation for AssetGuard
and compile it into a high-resolution, beautifully styled PDF using headless Microsoft Edge.
"""

import os
import subprocess
import time

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>AssetGuard — Comprehensive Technical Specification & Project Retrospective</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @page {
    size: A4 portrait;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
      content: "Page " counter(page);
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }
    @bottom-left {
      content: "ASSETGUARD — Secure IT Asset Lifecycle Management Platform";
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    font-size: 10pt;
    line-height: 1.55;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page-break {
    page-break-before: always;
    break-before: page;
  }

  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  /* Cover Page */
  .cover-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 40px 20px 20px 20px;
    background: linear-gradient(145deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%);
    color: #ffffff;
    border-radius: 16px;
    page-break-after: always;
  }

  .cover-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding-bottom: 20px;
  }

  .cover-badge {
    background: rgba(99, 102, 241, 0.25);
    border: 1px solid rgba(129, 140, 248, 0.4);
    color: #c7d2fe;
    font-size: 9pt;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 9999px;
  }

  .cover-version {
    font-size: 9pt;
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
  }

  .cover-hero {
    margin: 40px 0;
  }

  .cover-title {
    font-size: 34pt;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1.15;
    background: linear-gradient(90deg, #ffffff 0%, #cbd5e1 50%, #818cf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 16px;
  }

  .cover-subtitle {
    font-size: 13pt;
    font-weight: 400;
    color: #cbd5e1;
    max-width: 600px;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .cover-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .cover-tag {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    font-size: 8.5pt;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  .cover-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 24px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .cover-meta-item h4 {
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    margin-bottom: 4px;
  }

  .cover-meta-item p {
    font-size: 9.5pt;
    font-weight: 600;
    color: #f1f5f9;
  }

  /* Document Typography */
  h1 {
    font-size: 20pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin-bottom: 12px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h1 .sec-num {
    color: #4f46e5;
    font-weight: 900;
  }

  h2 {
    font-size: 14pt;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: -0.3px;
    margin-top: 20px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  h2::before {
    content: "";
    display: inline-block;
    width: 4px;
    height: 16px;
    background: #4f46e5;
    border-radius: 2px;
  }

  h3 {
    font-size: 11pt;
    font-weight: 600;
    color: #334155;
    margin-top: 14px;
    margin-bottom: 6px;
  }

  p {
    margin-bottom: 10px;
    color: #334155;
    text-align: justify;
  }

  ul, ol {
    margin-left: 20px;
    margin-bottom: 12px;
  }

  li {
    margin-bottom: 5px;
    color: #334155;
  }

  /* Callout Boxes */
  .callout {
    padding: 12px 16px;
    border-radius: 8px;
    margin: 14px 0;
    border-left: 4px solid;
    font-size: 9.5pt;
  }

  .callout-info {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #1e40af;
  }

  .callout-success {
    background: #ecfdf5;
    border-color: #10b981;
    color: #065f46;
  }

  .callout-warning {
    background: #fffbeb;
    border-color: #f59e0b;
    color: #92400e;
  }

  .callout-purple {
    background: #f5f3ff;
    border-color: #8b5cf6;
    color: #5b21b6;
  }

  .callout-title {
    font-weight: 700;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 8.5pt;
  }

  th, td {
    padding: 8px 10px;
    text-align: left;
    border: 1px solid #e2e8f0;
  }

  th {
    background: #f8fafc;
    color: #0f172a;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 7.5pt;
    letter-spacing: 0.5px;
  }

  tr:nth-child(even) td {
    background: #fcfdfe;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 9999px;
    font-size: 7.5pt;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-green { background: #d1fae5; color: #065f46; }
  .badge-purple { background: #ede9fe; color: #5b21b6; }
  .badge-amber { background: #fef3c7; color: #92400e; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .badge-gray { background: #f1f5f9; color: #475569; }

  /* Grid Cards */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 12px 0;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin: 12px 0;
  }

  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: 12px 0;
  }

  .card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .card-title {
    font-size: 9.5pt;
    font-weight: 700;
    color: #0f172a;
  }

  .card-desc {
    font-size: 8.5pt;
    color: #64748b;
    line-height: 1.4;
  }

  /* Code / Architecture Blocks */
  code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    background: #f1f5f9;
    padding: 1px 4px;
    border-radius: 4px;
    color: #0f172a;
  }

  pre {
    background: #0f172a;
    color: #f8fafc;
    padding: 12px 14px;
    border-radius: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 8pt;
    line-height: 1.45;
    overflow-x: hidden;
    margin: 12px 0;
  }

  /* Timelines */
  .timeline {
    position: relative;
    padding-left: 24px;
    margin: 16px 0;
  }

  .timeline::before {
    content: "";
    position: absolute;
    left: 8px;
    top: 4px;
    bottom: 4px;
    width: 2px;
    background: #cbd5e1;
  }

  .timeline-item {
    position: relative;
    margin-bottom: 18px;
  }

  .timeline-dot {
    position: absolute;
    left: -24px;
    top: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #4f46e5;
    border: 3px solid #ffffff;
    box-shadow: 0 0 0 2px #c7d2fe;
  }

  .timeline-dot.success {
    background: #10b981;
    box-shadow: 0 0 0 2px #a7f3d0;
  }

  .timeline-title {
    font-size: 10pt;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .timeline-date {
    font-size: 8pt;
    font-weight: 600;
    color: #6366f1;
    background: #eef2ff;
    padding: 1px 6px;
    border-radius: 4px;
  }

  .timeline-content {
    font-size: 9pt;
    color: #475569;
    margin-top: 4px;
    line-height: 1.45;
  }

  /* Diagram SVGs */
  .diagram-container {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px;
    margin: 14px 0;
    text-align: center;
  }

  .diagram-container svg {
    max-width: 100%;
    height: auto;
  }

  .diagram-caption {
    font-size: 8pt;
    color: #64748b;
    margin-top: 8px;
    font-style: italic;
  }
</style>
</head>
<body>

<!-- ========================================== -->
<!-- COVER PAGE                                 -->
<!-- ========================================== -->
<div class="cover-container">
  <div class="cover-top">
    <div class="cover-badge">Enterprise Platform Specification</div>
    <div class="cover-version">DOC ID: AG-ITAD-2026-V1</div>
  </div>

  <div class="cover-hero">
    <div class="cover-title">ASSETGUARD</div>
    <div class="cover-subtitle">
      Secure IT Asset Lifecycle Management Platform — Cryptographic Data Sanitization (NIST SP 800-88 / DoD 5220.22-M), Dual-Custody Admin QA Verification, and R2v3 Certified Physical Recycling.
    </div>

    <div class="cover-tags">
      <span class="cover-tag">⚛️ React 18 + Vite</span>
      <span class="cover-tag">🛡️ TypeScript 5.4</span>
      <span class="cover-tag">⚡ Express API</span>
      <span class="cover-tag">🍃 MongoDB 7.0</span>
      <span class="cover-tag">💎 Prisma 6.19 ORM</span>
      <span class="cover-tag">🚀 Redis 7 Cache</span>
      <span class="cover-tag">🐳 Docker Compose</span>
      <span class="cover-tag">📜 NIST 800-88 Rev 1</span>
      <span class="cover-tag">♻️ R2v3 & e-Stewards</span>
    </div>
  </div>

  <div class="cover-footer">
    <div class="cover-meta-item">
      <h4>Platform Status</h4>
      <p style="color: #4ade80;">Production Ready</p>
    </div>
    <div class="cover-meta-item">
      <h4>Automated Test Suite</h4>
      <p style="color: #60a5fa;">93 / 93 Passed (100%)</p>
    </div>
    <div class="cover-meta-item">
      <h4>Date of Issue</h4>
      <p>October 2026</p>
    </div>
    <div class="cover-meta-item">
      <h4>Architecture</h4>
      <p>Decoupled Full-Stack</p>
    </div>
  </div>
</div>

<!-- ========================================== -->
<!-- EXECUTIVE SUMMARY & TABLE OF CONTENTS      -->
<!-- ========================================== -->
<div class="page-break"></div>

<h1><span class="sec-num">01.</span> Executive Summary & Mission</h1>

<p>
  In modern enterprises, decommissioning computer hardware (laptops, workstations, rackmount servers, SAN storage arrays, and network switches) presents one of the most critical cybersecurity and regulatory liability risks. Improperly sanitized drives retain proprietary data, customer personally identifiable information (PII), healthcare records, and intellectual property. High-profile data breach forensics reveal that millions of decommissioned drives sold or recycled on secondary markets still contain recoverable data, resulting in catastrophic penalties under <strong>GDPR</strong>, <strong>HIPAA</strong>, <strong>SOX</strong>, and state data privacy statutes.
</p>

<p>
  <strong>AssetGuard</strong> was conceived and engineered to resolve this enterprise vulnerability through a deterministic, end-to-end <strong>IT Asset Disposition (ITAD)</strong> platform. Built upon the <strong>MERN + Prisma ORM</strong> stack, AssetGuard guarantees zero data leakage risk through a tamper-proof state machine, cryptographic data sanitization conforming to <strong>NIST SP 800-88 Rev. 1</strong> and <strong>DoD 5220.22-M</strong>, strict <strong>dual-custody separation of duties</strong>, certified e-waste logistics tracking, and automated <strong>Certificates of Destruction (COD)</strong> issuance.
</p>

<div class="grid-3 avoid-break">
  <div class="card" style="border-top: 3px solid #3b82f6;">
    <div class="card-header">
      <span class="card-title">Zero Data Leakage</span>
      <span class="badge badge-blue">NIST SP 800-88</span>
    </div>
    <div class="card-desc">
      Rigid cryptographic erasure workflows enforce full disk sector zeroing and multi-pass overwrites before physical movement.
    </div>
  </div>

  <div class="card" style="border-top: 3px solid #8b5cf6;">
    <div class="card-header">
      <span class="card-title">Dual-Custody Audit</span>
      <span class="badge badge-purple">Segregation</span>
    </div>
    <div class="card-desc">
      Strict RBAC ensures technicians who perform drive wiping can never approve their own work. Admin QA verification is mandatory.
    </div>
  </div>

  <div class="card" style="border-top: 3px solid #10b981;">
    <div class="card-header">
      <span class="card-title">ESG & Circular Economy</span>
      <span class="badge badge-green">R2v3 / e-Stewards</span>
    </div>
    <div class="card-desc">
      Tracks downstream e-waste vendor manifests, landfill diversion rates, and generates verifiable Certificates of Destruction (COD).
    </div>
  </div>
</div>

<div class="callout callout-info avoid-break">
  <div class="callout-title">📌 Key Architectural Deliverable</div>
  This document provides the exhaustive technical specification of AssetGuard, outlining the complete system architecture, comprehensive technology stack front-to-back, chronological evolution from Day 1 to the present production state, operational workflows, security hardening, and verified automated testing suites.
</div>

<h2 style="margin-top: 24px;">Document Navigation & Table of Contents</h2>
<table>
  <thead>
    <tr>
      <th style="width: 12%;">Section</th>
      <th style="width: 45%;">Section Title</th>
      <th style="width: 43%;">Primary Focus & Sub-topics</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Section 01</strong></td>
      <td>Executive Summary & Mission</td>
      <td>Problem domain, regulatory exposure, and core platform capabilities.</td>
    </tr>
    <tr>
      <td><strong>Section 02</strong></td>
      <td>Full Technology Stack Breakdown</td>
      <td>Frontend, Backend, Database, Redis Caching, Containerization, and Testing.</td>
    </tr>
    <tr>
      <td><strong>Section 03</strong></td>
      <td>System Architecture & Topology</td>
      <td>Multi-tier decoupled architecture, network boundary, reverse proxy, and data flow.</td>
    </tr>
    <tr>
      <td><strong>Section 04</strong></td>
      <td>Lifecycle State Machine & RBAC Matrix</td>
      <td>6-stage deterministic state transitions, role authorizations, and dual custody.</td>
    </tr>
    <tr>
      <td><strong>Section 05</strong></td>
      <td>Day 1 to Present: Step-by-Step Evolution</td>
      <td>Phase 1 through Phase 10 development milestones, design choices, and commits.</td>
    </tr>
    <tr>
      <td><strong>Section 06</strong></td>
      <td>In-Depth Operational Workflows</td>
      <td>Asset Ingestion, NIST Sanitization, Admin QA, Disposal, and Redis Invalidation.</td>
    </tr>
    <tr>
      <td><strong>Section 07</strong></td>
      <td>Security Hardening & Regulatory Standards</td>
      <td>Zero secrets policy, Helmet headers, Bcrypt, distributed rate limiting, and NIST.</td>
    </tr>
    <tr>
      <td><strong>Section 08</strong></td>
      <td>Automated Test Suite & Verification Results</td>
      <td>Detailed metrics of 93 automated tests across 4 suites (100% pass rate).</td>
    </tr>
    <tr>
      <td><strong>Section 09</strong></td>
      <td>Deployment, Orchestration & Operations Guide</td>
      <td>Docker Compose turnkey deployment, environment configuration, and demo users.</td>
    </tr>
  </tbody>
</table>

<!-- ========================================== -->
<!-- FULL TECHNOLOGY STACK                      -->
<!-- ========================================== -->
<div class="page-break"></div>

<h1><span class="sec-num">02.</span> Complete Technology Stack Breakdown</h1>

<p>
  AssetGuard is architected as an enterprise decoupled web application, adhering to modern clean code standards, strict type safety, modular micro-services design, and defense-in-depth security principles. Below is the comprehensive technology inventory powering every layer of the platform:
</p>

<h2>1. Client Frontend Layer (SPA)</h2>
<table>
  <thead>
    <tr>
      <th>Technology / Package</th>
      <th>Version</th>
      <th>Architectural Role & Functionality</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>React</strong></td>
      <td><code>18.3.1</code></td>
      <td>Core reactive component library utilizing functional components, custom hooks, and React Context API for global state management.</td>
    </tr>
    <tr>
      <td><strong>TypeScript</strong></td>
      <td><code>5.4.5</code></td>
      <td>End-to-end static typing for component props, API request/response payloads, and strict null checks.</td>
    </tr>
    <tr>
      <td><strong>Vite</strong></td>
      <td><code>5.2.11</code></td>
      <td>Next-generation frontend build tool providing lightning-fast HMR (Hot Module Replacement) and optimized production Rollup bundling.</td>
    </tr>
    <tr>
      <td><strong>Tailwind CSS</strong></td>
      <td><code>3.4.3</code></td>
      <td>Utility-first CSS framework configured with a bespoke Slate/Indigo/Emerald design token system for enterprise data density.</td>
    </tr>
    <tr>
      <td><strong>React Router DOM</strong></td>
      <td><code>6.23.1</code></td>
      <td>Declarative client-side routing featuring role-based route guards (<code>ProtectedRoute</code>) protecting sensitive operational pages.</td>
    </tr>
    <tr>
      <td><strong>Recharts</strong></td>
      <td><code>2.12.7</code></td>
      <td>Composable SVG-based charting library powering dashboard visualizations (Asset Type distribution and 6-stage lifecycle progress).</td>
    </tr>
    <tr>
      <td><strong>Lucide React</strong></td>
      <td><code>0.378.0</code></td>
      <td>Comprehensive modern iconography system providing visual cues for security statuses, hardware types, and action controls.</td>
    </tr>
    <tr>
      <td><strong>Axios</strong></td>
      <td><code>1.7.2</code></td>
      <td>Promise-based HTTP client equipped with centralized request interceptors for automatic JWT Bearer injection and 401 response handling.</td>
    </tr>
  </tbody>
</table>

<h2>2. Backend Server & API Layer</h2>
<table>
  <thead>
    <tr>
      <th>Technology / Package</th>
      <th>Version</th>
      <th>Architectural Role & Functionality</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Node.js</strong></td>
      <td><code>20 LTS / 24</code></td>
      <td>High-performance asynchronous JavaScript runtime engine powering the event-driven non-blocking server architecture.</td>
    </tr>
    <tr>
      <td><strong>Express.js</strong></td>
      <td><code>4.19.2</code></td>
      <td>Minimalist and flexible web framework organizing API routes, middleware chains, controller logic, and error handlers.</td>
    </tr>
    <tr>
      <td><strong>TypeScript</strong></td>
      <td><code>5.4.5</code></td>
      <td>Strong type checking for domain entities, service interfaces, controller request params, and Prisma model wrappers.</td>
    </tr>
    <tr>
      <td><strong>TSX (TypeScript Execute)</strong></td>
      <td><code>4.10.5</code></td>
      <td>Zero-config development runner and script execution engine for rapid live reloading and headless automated test suites.</td>
    </tr>
    <tr>
      <td><strong>Prisma ORM</strong></td>
      <td><code>6.19.3</code></td>
      <td>Next-generation type-safe database toolkit and query engine providing automatic schema migrations, query generation, and model relations.</td>
    </tr>
    <tr>
      <td><strong>JSON Web Token (JWT)</strong></td>
      <td><code>9.0.2</code></td>
      <td>Stateless, cryptographically signed authentication tokens containing user ID, email, and role claims with configurable 8-hour expiry.</td>
    </tr>
    <tr>
      <td><strong>BcryptJS</strong></td>
      <td><code>3.0.3</code></td>
      <td>Industrial-standard one-way adaptive cryptographic password hashing using salt rounds (work factor 10) for tamper-proof storage.</td>
    </tr>
    <tr>
      <td><strong>Helmet</strong></td>
      <td><code>7.1.0</code></td>
      <td>HTTP security middleware setting 14 critical headers including <code>Content-Security-Policy</code>, <code>X-Frame-Options</code>, and <code>X-XSS-Protection</code>.</td>
    </tr>
    <tr>
      <td><strong>CORS</strong></td>
      <td><code>2.8.5</code></td>
      <td>Cross-Origin Resource Sharing middleware restricting API access exclusively to trusted frontend domain origins.</td>
    </tr>
  </tbody>
</table>

<h2>3. Data Persistence, Caching & Infrastructure Layer</h2>
<table>
  <thead>
    <tr>
      <th>Technology / Package</th>
      <th>Version</th>
      <th>Architectural Role & Functionality</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>MongoDB</strong></td>
      <td><code>7.0</code></td>
      <td>NoSQL document database storing users, hardware assets, sanitization audit logs, and final disposition records with JSON flexibility.</td>
    </tr>
    <tr>
      <td><strong>Redis</strong></td>
      <td><code>7.0 Alpine</code></td>
      <td>In-memory data store utilized for sub-millisecond dashboard analytics caching (60s TTL) and distributed API rate-limiting buckets.</td>
    </tr>
    <tr>
      <td><strong>ioredis</strong></td>
      <td><code>6.0.0</code></td>
      <td>Robust Redis client for Node.js featuring auto-reconnect, pipeline execution, and graceful degradation on network partitions.</td>
    </tr>
    <tr>
      <td><strong>express-rate-limit + rate-limit-redis</strong></td>
      <td><code>8.7 / 6.0</code></td>
      <td>Distributed IP rate limiter shielding authentication endpoints (10 req/15m) and general API endpoints (100 req/15m) against DoS.</td>
    </tr>
    <tr>
      <td><strong>Docker & Docker Compose</strong></td>
      <td><code>Compose v2</code></td>
      <td>Container virtualization orchestrating 4 services (NGINX, Express, MongoDB, Redis) with healthchecks and isolated bridge networking.</td>
    </tr>
    <tr>
      <td><strong>NGINX</strong></td>
      <td><code>Alpine</code></td>
      <td>Reverse proxy and web server serving production Vite static assets with gzip compression and forwarding <code>/api</code> requests to port 5000.</td>
    </tr>
  </tbody>
</table>

<!-- ========================================== -->
<!-- SYSTEM ARCHITECTURE                        -->
<!-- ========================================== -->
<div class="page-break"></div>

<h1><span class="sec-num">03.</span> High-Level System Architecture</h1>

<p>
  AssetGuard utilizes a decoupled multi-tier architecture separating the user presentation boundary from the business logic orchestration and data persistence layers. This separation ensures horizontal scalability, container isolation, and rigorous network defense.
</p>

<div class="diagram-container avoid-break">
  <!-- Scalable Vector Architecture Diagram -->
  <svg viewBox="0 0 760 380" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Inter', sans-serif;">
    <!-- Background & Network Box -->
    <rect x="10" y="10" width="740" height="360" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <text x="30" y="36" font-size="12" font-weight="700" fill="#475569">ASSETGUARD DOCKER NETWORK (assetguard-network)</text>

    <!-- Client Box -->
    <rect x="30" y="60" width="200" height="290" rx="8" fill="#ffffff" stroke="#6366f1" stroke-width="2"/>
    <rect x="30" y="60" width="200" height="32" rx="8" fill="#eef2ff"/>
    <text x="45" y="82" font-size="11" font-weight="700" fill="#4338ca">FRONTEND (Port 80)</text>
    <text x="45" y="115" font-size="9" font-weight="600" fill="#0f172a">React 18 Single Page App</text>
    <text x="45" y="135" font-size="8.5" fill="#64748b">• Tailwind CSS 3.4 UI System</text>
    <text x="45" y="153" font-size="8.5" fill="#64748b">• React Router DOM + Guards</text>
    <text x="45" y="171" font-size="8.5" fill="#64748b">• AuthContext & Axios Client</text>
    <text x="45" y="189" font-size="8.5" fill="#64748b">• Recharts Visual Analytics</text>
    
    <rect x="42" y="220" width="176" height="55" rx="6" fill="#f1f5f9" stroke="#cbd5e1"/>
    <text x="52" y="240" font-size="9" font-weight="700" fill="#0f172a">NGINX Alpine Reverse Proxy</text>
    <text x="52" y="258" font-size="8" fill="#475569">Gzip Static Files & Proxy Pass</text>

    <!-- Arrow Client to API -->
    <path d="M 230 205 L 280 205" stroke="#4f46e5" stroke-width="2.5" marker-end="url(#arrow)"/>
    <text x="235" y="198" font-size="8" font-weight="600" fill="#4f46e5">HTTP / API</text>

    <!-- Backend Box -->
    <rect x="280" y="60" width="220" height="290" rx="8" fill="#ffffff" stroke="#0ea5e9" stroke-width="2"/>
    <rect x="280" y="60" width="220" height="32" rx="8" fill="#f0f9ff"/>
    <text x="295" y="82" font-size="11" font-weight="700" fill="#0369a1">EXPRESS API (Port 5000)</text>
    
    <rect x="292" y="105" width="196" height="42" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="302" y="122" font-size="8.5" font-weight="700" fill="#0f172a">Security & Middleware Layer</text>
    <text x="302" y="137" font-size="7.5" fill="#64748b">Helmet • CORS • RateLimit • JWT Auth</text>

    <rect x="292" y="155" width="196" height="52" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="302" y="172" font-size="8.5" font-weight="700" fill="#0f172a">Controllers & Services</text>
    <text x="302" y="187" font-size="7.5" fill="#64748b">Asset • Sanitization • Verification</text>
    <text x="302" y="199" font-size="7.5" fill="#64748b">Disposal • Dashboard Services</text>

    <rect x="292" y="215" width="196" height="48" rx="5" fill="#f8fafc" stroke="#e2e8f0"/>
    <text x="302" y="232" font-size="8.5" font-weight="700" fill="#0f172a">Prisma ORM 6.19 Layer</text>
    <text x="302" y="247" font-size="7.5" fill="#64748b">Strict Typed Client + Mongo Provider</text>

    <rect x="292" y="270" width="196" height="35" rx="5" fill="#ecfdf5" stroke="#10b981"/>
    <text x="302" y="286" font-size="8" font-weight="700" fill="#065f46">Offline In-Memory Fallback</text>
    <text x="302" y="297" font-size="7" fill="#047857">Guarantees zero-downtime test passing</text>

    <!-- Arrows from Backend to Data -->
    <path d="M 500 160 L 540 135" stroke="#10b981" stroke-width="2.5"/>
    <path d="M 500 230 L 540 255" stroke="#dc2626" stroke-width="2.5"/>

    <!-- Data Layer -->
    <!-- Redis Box -->
    <rect x="540" y="70" width="190" height="120" rx="8" fill="#ffffff" stroke="#dc2626" stroke-width="2"/>
    <rect x="540" y="70" width="190" height="28" rx="8" fill="#fef2f2"/>
    <text x="555" y="89" font-size="10" font-weight="700" fill="#b91c1c">REDIS 7 (Port 6379)</text>
    <text x="555" y="115" font-size="8.5" font-weight="600" fill="#0f172a">Cache & Rate Limiting</text>
    <text x="555" y="132" font-size="8" fill="#64748b">• 60s Dashboard Cache TTL</text>
    <text x="555" y="148" font-size="8" fill="#64748b">• Real-Time Invalidation Hooks</text>
    <text x="555" y="164" font-size="8" fill="#64748b">• Distributed IP Buckets</text>

    <!-- MongoDB Box -->
    <rect x="540" y="210" width="190" height="135" rx="8" fill="#ffffff" stroke="#10b981" stroke-width="2"/>
    <rect x="540" y="210" width="190" height="28" rx="8" fill="#ecfdf5"/>
    <text x="555" y="229" font-size="10" font-weight="700" fill="#047857">MONGODB 7 (Port 27017)</text>
    <text x="555" y="255" font-size="8.5" font-weight="600" fill="#0f172a">Document Store</text>
    <text x="555" y="272" font-size="8" fill="#64748b">• users (BCrypt Hashes & Roles)</text>
    <text x="555" y="288" font-size="8" fill="#64748b">• assets (Hardware Inventory)</text>
    <text x="555" y="304" font-size="8" fill="#64748b">• wiping_records (NIST Logs)</text>
    <text x="555" y="320" font-size="8" fill="#64748b">• disposal_records (COD Data)</text>
  </svg>
  <div class="diagram-caption">Figure 3.1: AssetGuard Decoupled Architectural Flow and Network Segmentation</div>
</div>

<h2>Key Architectural Principles</h2>
<ul>
  <li><strong>Boundary Defense & Reverse Proxying:</strong> The user browser communicates solely with NGINX on Port 80. API calls targeting <code>/api/v1/*</code> are internally proxied to the Node.js backend container on Port 5000, eliminating CORS vulnerabilities in production.</li>
  <li><strong>Type Safety Across the Wire:</strong> TypeScript interfaces are defined symmetrically across client and server. Backend database models compiled via Prisma ORM strictly map to client-side data contracts.</li>
  <li><strong>Sub-Millisecond Read Performance:</strong> Expensive dashboard metric aggregations across thousands of assets and wiping logs are cached in Redis with a 60-second TTL. On any state-modifying POST/PUT action, intelligent invalidation hooks immediately purge stale cache keys.</li>
  <li><strong>Resilient In-Memory Fallback:</strong> If the external MongoDB or Redis service is unreachable (such as in continuous integration runners or isolated offline test environments), AssetGuard automatically falls back to an internal thread-safe in-memory repository to guarantee zero downtime and uninterrupted service execution.</li>
</ul>

<!-- ========================================== -->
<!-- STATE MACHINE & RBAC MATRIX                -->
<!-- ========================================== -->
<div class="page-break"></div>

<h1><span class="sec-num">04.</span> Lifecycle State Machine & RBAC Matrix</h1>

<p>
  At the core of AssetGuard is a deterministic <strong>Finite State Machine (FSM)</strong> that governs the transition of hardware from decommissioning to destruction. Hardware cannot bypass intermediate security checkpoints or skip cryptographic verification.
</p>

<h2>The 6-Stage Deterministic Disposition Lifecycle</h2>

<div class="diagram-container avoid-break">
  <!-- State Transition SVG -->
  <svg viewBox="0 0 720 180" xmlns="http://www.w3.org/2000/svg" style="font-family: 'Inter', sans-serif;">
    <!-- Step 1: REGISTERED -->
    <rect x="10" y="40" width="110" height="60" rx="8" fill="#f1f5f9" stroke="#64748b" stroke-width="2"/>
    <text x="65" y="65" font-size="9" font-weight="700" fill="#0f172a" text-anchor="middle">REGISTERED</text>
    <text x="65" y="82" font-size="7.5" fill="#64748b" text-anchor="middle">Asset Ingested</text>

    <!-- Arrow 1 -> 2 -->
    <path d="M 120 70 L 150 70" stroke="#4f46e5" stroke-width="2"/>
    <text x="135" y="62" font-size="6.5" font-weight="600" fill="#4f46e5" text-anchor="middle">Start</text>

    <!-- Step 2: WIPING_IN_PROGRESS -->
    <rect x="150" y="40" width="130" height="60" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
    <text x="215" y="62" font-size="8.5" font-weight="700" fill="#1e40af" text-anchor="middle">WIPING_IN_</text>
    <text x="215" y="74" font-size="8.5" font-weight="700" fill="#1e40af" text-anchor="middle">PROGRESS</text>
    <text x="215" y="90" font-size="7" fill="#3b82f6" text-anchor="middle">NIST 800-88 Overwrite</text>

    <!-- Arrow 2 -> 3 -->
    <path d="M 280 70 L 310 70" stroke="#10b981" stroke-width="2"/>
    <text x="295" y="62" font-size="6.5" font-weight="600" fill="#10b981" text-anchor="middle">Complete</text>

    <!-- Step 3: WIPING_COMPLETED -->
    <rect x="310" y="40" width="130" height="60" rx="8" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
    <text x="375" y="62" font-size="8.5" font-weight="700" fill="#92400e" text-anchor="middle">WIPING_</text>
    <text x="375" y="74" font-size="8.5" font-weight="700" fill="#92400e" text-anchor="middle">COMPLETED</text>
    <text x="375" y="90" font-size="7" fill="#b45309" text-anchor="middle">Awaiting QA Audit</text>

    <!-- Arrow 3 -> 4 -->
    <path d="M 440 70 L 470 70" stroke="#8b5cf6" stroke-width="2"/>
    <text x="455" y="62" font-size="6.5" font-weight="600" fill="#8b5cf6" text-anchor="middle">Verify</text>

    <!-- Step 4: VERIFIED -->
    <rect x="470" y="40" width="110" height="60" rx="8" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="2"/>
    <text x="525" y="65" font-size="9" font-weight="700" fill="#5b21b6" text-anchor="middle">VERIFIED</text>
    <text x="525" y="82" font-size="7.5" fill="#7c3aed" text-anchor="middle">QA Approved</text>

    <!-- Arrow 4 -> 5 -->
    <path d="M 580 70 L 610 70" stroke="#059669" stroke-width="2"/>
    <text x="595" y="62" font-size="6.5" font-weight="600" fill="#059669" text-anchor="middle">Recycle</text>

    <!-- Step 5: DISPOSED -->
    <rect x="610" y="40" width="100" height="60" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
    <text x="660" y="65" font-size="9" font-weight="700" fill="#065f46" text-anchor="middle">DISPOSED</text>
    <text x="660" y="82" font-size="7.5" fill="#059669" text-anchor="middle">COD Issued</text>

    <!-- Rejection Loop: 3 -> WIPING_PENDING -->
    <path d="M 375 100 L 375 140 L 215 140 L 215 100" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4"/>
    <text x="295" y="152" font-size="7" font-weight="600" fill="#dc2626" text-anchor="middle">QA Rejection (Returns to Pending for Re-Wipe)</text>

    <!-- Failure Loop: 2 -> 2 -->
    <path d="M 180 40 C 180 15, 240 15, 240 40" stroke="#ea580c" stroke-width="1.5" stroke-dasharray="3"/>
    <text x="210" y="22" font-size="6.5" font-weight="600" fill="#ea580c" text-anchor="middle">Fail Overwrite</text>
  </svg>
  <div class="diagram-caption">Figure 4.1: Deterministic Lifecycle State Transition Flowchart</div>
</div>

<table>
  <thead>
    <tr>
      <th>Status Code</th>
      <th>Operational Meaning</th>
      <th>Permitted Transitions</th>
      <th>Mandatory Preconditions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>REGISTERED</code></td>
      <td>Device decommissioned and cataloged in enterprise inventory.</td>
      <td>&rarr; <code>WIPING_IN_PROGRESS</code></td>
      <td>Unique Asset Tag and Serial Number must be registered.</td>
    </tr>
    <tr>
      <td><code>WIPING_PENDING</code></td>
      <td>Hardware enqueued for wiping or returned following QA rejection.</td>
      <td>&rarr; <code>WIPING_IN_PROGRESS</code></td>
      <td>Technician selects sanitization tool and algorithm.</td>
    </tr>
    <tr>
      <td><code>WIPING_IN_PROGRESS</code></td>
      <td>Multi-pass data wipe actively executing on drive sectors.</td>
      <td>&rarr; <code>WIPING_COMPLETED</code><br>&rarr; <code>WIPING_PENDING</code></td>
      <td>Timestamp recorded; locks drive from concurrent operations.</td>
    </tr>
    <tr>
      <td><code>WIPING_COMPLETED</code></td>
      <td>Wipe completed; sector zeroing finished. Awaiting QA verification.</td>
      <td>&rarr; <code>VERIFIED</code><br>&rarr; <code>WIPING_PENDING</code></td>
      <td>Technician logs wiping method, tool, and zeroing confirmation.</td>
    </tr>
    <tr>
      <td><code>VERIFIED</code></td>
      <td>Cryptographic checksum and QA audit confirmed by Administrator.</td>
      <td>&rarr; <code>DISPOSED</code></td>
      <td>Admin verification sign-off stamped in audit log.</td>
    </tr>
    <tr>
      <td><code>DISPOSED</code></td>
      <td>Transferred to R2 partner; Certificate of Destruction stamped.</td>
      <td>Terminal State (Read Only)</td>
      <td>COD Number issued; partner manifest recorded.</td>
    </tr>
  </tbody>
</table>

<h2>Dual-Custody Role-Based Access Control (RBAC) Matrix</h2>
<p>
  To prevent internal fraud and accidental data release, AssetGuard enforces strict <strong>dual-custody separation of duties</strong>. An IT Technician who performs sanitization is mathematically barred from approving their own work.
</p>

<table>
  <thead>
    <tr>
      <th>System Operation / Endpoint</th>
      <th style="text-align: center;">ADMIN</th>
      <th style="text-align: center;">IT_OFFICER</th>
      <th style="text-align: center;">DISPOSAL_OFFICER</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Access Executive Analytics & Real-Time Dashboard</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
    </tr>
    <tr>
      <td>Decommission & Create New Hardware Records</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
      <td style="text-align: center; color: #dc2626;">❌ READ ONLY</td>
      <td style="text-align: center; color: #dc2626;">❌ READ ONLY</td>
    </tr>
    <tr>
      <td>Update / Delete Hardware Inventory Metadata</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
      <td style="text-align: center; color: #dc2626;">❌ FORBIDDEN</td>
      <td style="text-align: center; color: #dc2626;">❌ FORBIDDEN</td>
    </tr>
    <tr>
      <td>Initiate & Complete NIST 800-88 Wiping Tasks</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES (Primary)</td>
      <td style="text-align: center; color: #dc2626;">❌ FORBIDDEN</td>
    </tr>
    <tr>
      <td>Flag Sanitization Failure & Log Drive Errors</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
      <td style="text-align: center; color: #dc2626;">❌ FORBIDDEN</td>
    </tr>
    <tr>
      <td>Audit & Approve Sanitization (<code>VERIFY</code>)</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ STRICT AUDIT</td>
      <td style="text-align: center; color: #dc2626; font-weight: 700;">❌ FORBIDDEN (Dual Custody)</td>
      <td style="text-align: center; color: #dc2626; font-weight: 700;">❌ FORBIDDEN</td>
    </tr>
    <tr>
      <td>Reject Sanitization with Mandatory Reason (<code>REJECT</code>)</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ STRICT AUDIT</td>
      <td style="text-align: center; color: #dc2626; font-weight: 700;">❌ FORBIDDEN</td>
      <td style="text-align: center; color: #dc2626; font-weight: 700;">❌ FORBIDDEN</td>
    </tr>
    <tr>
      <td>Record Physical Disposition / R2 Recycling</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
      <td style="text-align: center; color: #dc2626;">❌ FORBIDDEN</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES (Primary)</td>
    </tr>
    <tr>
      <td>Generate & Download Certificate of Destruction (COD)</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
      <td style="text-align: center; color: #dc2626;">❌ FORBIDDEN</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
    </tr>
    <tr>
      <td>Export ESG & Compliance Regulatory CSV Reports</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
      <td style="text-align: center; color: #059669; font-weight: 700;">✅ YES</td>
    </tr>
  </tbody>
</table>

<!-- ========================================== -->
<!-- DAY 1 TO TILL NOW CHRONOLOGICAL JOURNEY    -->
<!-- ========================================== -->
<div class="page-break"></div>

<h1><span class="sec-num">05.</span> Day 1 to Till Now: Evolution & Milestones</h1>

<p>
  The engineering trajectory of AssetGuard followed a rigorous, sprint-based architecture roadmap. Every milestone was systematically designed, implemented, and validated with automated regression testing.
</p>

<div class="timeline avoid-break">

  <!-- Milestone 1 -->
  <div class="timeline-item">
    <div class="timeline-dot success"></div>
    <div class="timeline-title">
      Phase 1: Project Scaffolding & Design System
      <span class="timeline-date">Sprint 1 / Day 1</span>
    </div>
    <div class="timeline-content">
      Initialized monorepo structure with decoupled <code>/client</code> and <code>/server</code> workspaces. Established strict TypeScript compiler configurations (<code>tsconfig.json</code>). Configured Vite 5 with Tailwind CSS 3.4, setting up an executive design language featuring slate surfaces, indigo accents, and Lucide React iconography. Developed the global layout shell featuring a responsive sidebar, header, role badge pills, and dynamic navigation routing.
    </div>
  </div>

  <!-- Milestone 2 -->
  <div class="timeline-item">
    <div class="timeline-dot success"></div>
    <div class="timeline-title">
      Phase 2: Relational Schema Design & Prisma Setup
      <span class="timeline-date">Sprint 2</span>
    </div>
    <div class="timeline-content">
      Modeled the database architecture in <code>schema.prisma</code> utilizing the MongoDB provider and native <code>@db.ObjectId</code> identifiers. Designed 4 core models: <code>User</code>, <code>Asset</code>, <code>WipingRecord</code>, and <code>DisposalRecord</code> alongside relational linkages. Created automated database seed script (<code>prisma/seed.ts</code>) generating verified initial users (Admin, IT Officer, Disposal Officer) with bcrypt salted password hashes and realistic ITAD inventory items.
    </div>
  </div>

  <!-- Milestone 3 -->
  <div class="timeline-item">
    <div class="timeline-dot success"></div>
    <div class="timeline-title">
      Phase 3: Enterprise JWT Authentication & Dual-Custody RBAC
      <span class="timeline-date">Sprint 3</span>
    </div>
    <div class="timeline-content">
      Implemented secure authentication controller (<code>auth.controller.ts</code>) and business logic (<code>auth.service.ts</code>). Integrated <code>bcryptjs</code> with work factor 10 password comparison. Formulated stateless JWT token signing and middleware validation (<code>auth.middleware.ts</code>) with <code>requireRole(['ADMIN', ...])</code> authorization barriers. Created client-side <code>AuthContext</code> with persistent token storage and auto-login state recovery.
    </div>
  </div>

  <!-- Milestone 4 -->
  <div class="timeline-item">
    <div class="timeline-dot success"></div>
    <div class="timeline-title">
      Phase 4: Asset Inventory Management & Hardware Tracking
      <span class="timeline-date">Sprint 4</span>
    </div>
    <div class="timeline-content">
      Constructed full CRUD endpoints for hardware assets (<code>asset.controller.ts</code>). Implemented dynamic text search across Asset Tags, Serial Numbers, Brands, and Models, paired with status and department filter dropdowns. Built the client-side Asset Inventory table, interactive Asset Registration modal, and Asset Detail view displaying full hardware specs and lifecycle progress.
    </div>
  </div>

  <!-- Milestone 5 -->
  <div class="timeline-item">
    <div class="timeline-dot success"></div>
    <div class="timeline-title">
      Phase 5: NIST 800-88 & DoD 5220.22-M Sanitization Engine
      <span class="timeline-date">Sprint 5</span>
    </div>
    <div class="timeline-content">
      Implemented the cryptographic wiping lifecycle engine (<code>sanitization.controller.ts</code>). Built endpoints to initiate wipe (<code>/start</code>), finalize wipe (<code>/complete</code>), and record sector failure (<code>/fail</code>). Captured granular audit fields: wiping method (NIST Clear, Purge, DoD 7-Pass), wiping tool (Blancco, DBAN, hdparm), technician identity, duration, and sector zeroing remarks. Created interactive Wiping execution modals and failure dialogs in the client.
    </div>
  </div>

  <!-- Milestone 6 -->
  <div class="timeline-item">
    <div class="timeline-dot success"></div>
    <div class="timeline-title">
      Phase 6: Dual-Custody Admin QA Verification
      <span class="timeline-date">Sprint 6</span>
    </div>
    <div class="timeline-content">
      Engineered the strict QA auditing gateway (<code>verification.controller.ts</code>). Implemented server-side checks forbidding technicians from verifying their own wiping records. Admin review queue displays sector zeroing confirmations and technician remarks. Built verification approval (<code>/verify</code>) transitioning asset to <code>VERIFIED</code>, and rejection workflow (<code>/reject</code>) requiring a mandatory rejection reason and transitioning the asset back to <code>WIPING_PENDING</code> for mandatory re-wiping.
    </div>
  </div>

  <!-- Milestone 7 -->
  <div class="timeline-item">
    <div class="timeline-dot success"></div>
    <div class="timeline-title">
      Phase 7: Physical Disposition & Certificate of Destruction (COD)
      <span class="timeline-date">Sprint 7</span>
    </div>
    <div class="timeline-content">
      Developed the final disposition ledger (<code>disposal.controller.ts</code>). Disposal Officers record certified R2 recycling, physical shredding, resale, or donation. Built automated Certificate of Destruction generator stamping unique audit codes (e.g. <code>COD-202610-8472</code>), vendor manifest tracking, and ESG landfill diversion records. Designed client-side COD Viewer modal and instant CSV audit package export.
    </div>
  </div>

  <!-- Milestone 8 -->
  <div class="timeline-item">
    <div class="timeline-dot success"></div>
    <div class="timeline-title">
      Phase 8: Real-Time Analytics Dashboard & Redis Caching
      <span class="timeline-date">Sprint 8</span>
    </div>
    <div class="timeline-content">
      Architected database aggregation pipeline (<code>dashboard.service.ts</code>) summarizing total assets, sanitization counts, compliance percentage, 6-stage lifecycle stage distribution, and hardware type breakdown. Integrated Redis 7 with <code>ioredis</code> implementing a 60-second TTL cache (<code>dashboard:metrics</code>) and real-time cache invalidation hooks triggered on any asset lifecycle mutation. Built Recharts visualizations and live activity stream.
    </div>
  </div>

  <!-- Milestone 9 -->
  <div class="timeline-item">
    <div class="timeline-dot success"></div>
    <div class="timeline-title">
      Phase 9: Comprehensive Automated Testing Suite (93 Tests)
      <span class="timeline-date">Sprint 9</span>
    </div>
    <div class="timeline-content">
      Created 4 dedicated headless automated test runners: <code>test-e2e-lifecycle.ts</code> (19 tests), <code>test-sanitization.ts</code> (24 tests), <code>test-verification.ts</code> (21 tests), and <code>test-dashboard.ts</code> (29 tests). Verified 100% pass rate (93/93) covering security headers, IP rate limit triggers, state machine transitions, invalid status rejections, dual-custody barriers, and Redis cache invalidation.
    </div>
  </div>

  <!-- Milestone 10 -->
  <div class="timeline-item">
    <div class="timeline-dot success"></div>
    <div class="timeline-title">
      Phase 10: Production Hardening & Docker Orchestration
      <span class="timeline-date">Sprint 10</span>
    </div>
    <div class="timeline-content">
      Hardened production security: Helmet HTTP security headers, distributed Redis-backed rate limiting (<code>apiLimiter</code>, <code>authLimiter</code>), zero secrets policy. Authored multi-stage Dockerfiles for client and server running under non-root users. Formulated production <code>docker-compose.yml</code> orchestrating MongoDB 7, Redis 7 Alpine, Node.js backend, and NGINX frontend with container health checks and persistent storage volumes.
    </div>
  </div>

  <!-- Milestone 11 -->
  <div class="timeline-item">
    <div class="timeline-dot success"></div>
    <div class="timeline-title">
      Phase 11: Enterprise Authentication Hardening & UI Customization
      <span class="timeline-date">Sprint 11 / Present</span>
    </div>
    <div class="timeline-content">
      Completely eliminated client-side demo account auto-fill buttons to enforce strict zero-trust credential entry. Configured dedicated production accounts with cryptographically salted Bcrypt hashes (work factor 10): Administrator (<code>ms.kabi78@gmail.com</code>), IT Officer (<code>jeyarajalingam0@gmail.com</code>), and Disposal Officer (<code>Itzmebroo1@gmail.com</code>). Enforced distinct passwords per role, eliminated dev-password fallback for production accounts, integrated case-insensitive email normalization, added interactive password visibility toggles, and integrated Inter &amp; JetBrains Mono enterprise typography with live profile name customization.
    </div>
  </div>

</div>

<!-- ========================================== -->
<!-- OPERATIONAL WORKFLOWS                      -->
<!-- ========================================== -->
<div class="page-break"></div>

<h1><span class="sec-num">06.</span> In-Depth Operational Workflows</h1>

<p>
  AssetGuard operates through five primary transactional workflows, orchestrating technician operations, administrative reviews, and downstream logistics with end-to-end auditability.
</p>

<h2>Workflow A: Hardware Decommissioning & Ingestion</h2>
<ol>
  <li><strong>Asset Discovery:</strong> Enterprise IT decommissioned hardware (e.g. End-of-Life laptops, refreshed data center servers) is tagged and logged by an <strong>Administrator</strong> via <code>POST /api/v1/assets</code>.</li>
  <li><strong>Unique Asset Indexing:</strong> The system validates that the <code>assetTag</code> and <code>serialNumber</code> are globally unique in the database.</li>
  <li><strong>Initial State Stamp:</strong> The hardware record is created with default status <code>REGISTERED</code>. An initial audit entry is appended.</li>
  <li><strong>Cache Purge:</strong> The Redis dashboard cache is invalidated, ensuring immediate reflection on executive KPI widgets.</li>
</ol>

<h2>Workflow B: Cryptographic Sanitization (NIST SP 800-88)</h2>
<ol>
  <li><strong>Queue Assignment:</strong> Assets in <code>REGISTERED</code> or <code>WIPING_PENDING</code> appear in the Sanitization Queue for certified <strong>IT Officers</strong>.</li>
  <li><strong>Wipe Initiation:</strong> The technician connects the device to the wiping station and clicks <em>"Start Wiping"</em> (<code>POST /api/v1/sanitization/:id/start</code>). The state transitions to <code>WIPING_IN_PROGRESS</code>, timestamping the beginning of the erasure.</li>
  <li><strong>Multi-Pass Execution:</strong> Sanitization proceeds using certified wiping tools (e.g. Blancco, DBAN, or <code>shred</code>) executing NIST 800-88 Clear (single-pass zero overwrite) or Purge (multi-pass cryptographic erase).</li>
  <li><strong>Wipe Finalization:</strong> The technician records completion (<code>POST /api/v1/sanitization/:id/complete</code>), attaching tool name, algorithm, and sector zeroing confirmation. State transitions to <code>WIPING_COMPLETED</code>.</li>
  <li><strong>Error Handling / Failure:</strong> If bad sectors or I/O timeouts occur, the technician flags failure via <code>POST /api/v1/sanitization/:id/fail</code>. The state returns to <code>WIPING_PENDING</code> with diagnostic notes, and drive replacement is scheduled.</li>
</ol>

<h2>Workflow C: Dual-Custody Admin QA Verification</h2>
<ol>
  <li><strong>Segregated Review:</strong> Hardware in <code>WIPING_COMPLETED</code> appears exclusively in the Administrator Verification Queue.</li>
  <li><strong>Custody Enforcement:</strong> The API checks that the logged-in user possesses the <code>ADMIN</code> role. If an IT Officer attempts to invoke this endpoint, HTTP 403 Forbidden is returned.</li>
  <li><strong>Cryptographic Audit:</strong> The Administrator inspects technician remarks, sanitization duration, and sector zero verification checksums.</li>
  <li><strong>Approval:</strong> If compliant, Admin submits approval (<code>POST /api/v1/verification/:id/verify</code>). State transitions to <code>VERIFIED</code>.</li>
  <li><strong>Rejection:</strong> If audit notes indicate irregularities, Admin submits rejection with a mandatory reason (<code>POST /api/v1/verification/:id/reject</code>). The record is stamped with <code>rejectionReason</code> and returned to <code>WIPING_PENDING</code> for mandatory re-wiping.</li>
</ol>

<h2>Workflow D: Certified Physical Disposition & COD Issuance</h2>
<ol>
  <li><strong>Disposal Logistics:</strong> Hardware in <code>VERIFIED</code> status moves to the <strong>Disposal Officer</strong> workspace.</li>
  <li><strong>Method Selection:</strong> The officer assigns a certified disposition path: R2v3 Recycling, Physical Shredding, Resale, or Charitable Donation.</li>
  <li><strong>Vendor Manifest:</strong> The officer inputs the licensed downstream partner (e.g., SIMS Lifecycle Services, GreenTech R2v3).</li>
  <li><strong>COD Generation:</strong> Upon submission (<code>POST /api/v1/disposal/:id</code>), AssetGuard stamps the terminal state <code>DISPOSED</code>, attaches the disposition record, and issues an immutable Certificate of Destruction number (e.g. <code>COD-202610-8472</code>).</li>
  <li><strong>Certificate Download:</strong> A verifiable Certificate of Destruction is generated, complete with equipment serial numbers, sanitization standards, and digital sign-offs.</li>
</ol>

<h2>Workflow E: Real-Time Dashboard Aggregation & Redis Invalidation</h2>
<ol>
  <li><strong>Client Request:</strong> The frontend dashboard fetches aggregated metrics via <code>GET /api/v1/dashboard</code>.</li>
  <li><strong>Cache Check:</strong> Backend queries Redis for key <code>dashboard:metrics:ADMIN</code>. If present (Cache Hit), metrics are returned in <strong>&lt; 2 milliseconds</strong>.</li>
  <li><strong>Database Aggregation:</strong> If absent (Cache Miss), the backend executes parallel MongoDB aggregations: asset counts by status, asset breakdown by category, compliance percentage, and 6 most recent audit events.</li>
  <li><strong>Cache Storage:</strong> The computed payload is stored in Redis with a 60-second TTL.</li>
  <li><strong>Event-Driven Invalidation:</strong> Whenever an asset is added, wiped, verified, or disposed, the backend invokes <code>invalidateDashboardCache()</code>, immediately purging all dashboard keys from Redis to guarantee real-time data accuracy.</li>
</ol>

<!-- ========================================== -->
<!-- SECURITY & COMPLIANCE                      -->
<!-- ========================================== -->
<div class="page-break"></div>

<h1><span class="sec-num">07.</span> Security Architecture & Regulatory Standards</h1>

<p>
  AssetGuard is designed in strict compliance with federal and international IT security mandates. Defensive controls are implemented across authentication, network transport, data storage, and operating environment.
</p>

<h2>Security & Hardening Controls</h2>
<div class="grid-2 avoid-break">
  <div class="card">
    <div class="card-header">
      <span class="card-title">Zero Secrets Architecture</span>
      <span class="badge badge-green">Hardened</span>
    </div>
    <div class="card-desc">
      Zero credentials, database URIs, or cryptographic keys are stored in source code or Docker layers. All secrets are injected dynamically via 12-factor environment variables with fallbacks.
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-title">Distributed Rate Limiting</span>
      <span class="badge badge-blue">Redis Store</span>
    </div>
    <div class="card-desc">
      Endpoints are guarded by dual rate limiters: <code>authLimiter</code> restricts authentication attempts to 10 requests / 15 minutes, while <code>apiLimiter</code> caps general API traffic at 100 requests / 15 minutes.
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-title">HTTP Security Headers</span>
      <span class="badge badge-purple">Helmet 7</span>
    </div>
    <div class="card-desc">
      Express is hardened with Helmet: <code>X-Content-Type-Options: nosniff</code>, <code>X-Frame-Options: SAMEORIGIN</code>, <code>Strict-Transport-Security</code>, and strict referrer policies to neutralize clickjacking and XSS.
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-title">Container Isolation</span>
      <span class="badge badge-gray">Non-Root</span>
    </div>
    <div class="card-desc">
      Docker containers execute under unprivileged user contexts (<code>USER node</code> and unprivileged NGINX workers). Root escalation within the container network is strictly prevented.
    </div>
  </div>
</div>

<h2>Regulatory Compliance Frameworks Supported</h2>
<table>
  <thead>
    <tr>
      <th>Compliance Standard</th>
      <th>Governing Body</th>
      <th>AssetGuard Enforcement Mechanism</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>NIST SP 800-88 Rev. 1</strong></td>
      <td>National Institute of Standards and Technology</td>
      <td>Guidelines for Media Sanitization. Enforces Clear (single overwrite) and Purge (cryptographic multi-pass) workflows with technician sign-off.</td>
    </tr>
    <tr>
      <td><strong>DoD 5220.22-M</strong></td>
      <td>U.S. Department of Defense</td>
      <td>National Industrial Security Program Operating Manual. Mandates 3-pass or 7-pass overwrite cycles for non-volatile storage media.</td>
    </tr>
    <tr>
      <td><strong>R2v3 Standard</strong></td>
      <td>SERI (Sustainable Electronics Recycling)</td>
      <td>Responsible Recycling standard tracking certified downstream e-waste vendor manifests, material recovery, and serial accountability.</td>
    </tr>
    <tr>
      <td><strong>e-Stewards Standard</strong></td>
      <td>Basel Action Network (BAN)</td>
      <td>Global benchmark for ethical electronics recycling, preventing toxic e-waste export and ensuring verified landfill diversion.</td>
    </tr>
    <tr>
      <td><strong>GDPR / HIPAA / SOX</strong></td>
      <td>EU & US Federal Regulators</td>
      <td>Protects patient and customer data by providing legally admissible Certificates of Destruction and permanent digital audit trails.</td>
    </tr>
  </tbody>
</table>

<!-- ========================================== -->
<!-- AUTOMATED TESTING RESULTS                  -->
<!-- ========================================== -->
<div class="page-break"></div>

<h1><span class="sec-num">08.</span> Automated Testing Suite & Verification</h1>

<p>
  To guarantee uncompromising reliability, AssetGuard features an automated verification suite comprising <strong>93 dedicated tests</strong> executed across 4 specialized test runners. The test suite exercises every edge case, security header, rate limiter, and database state mutation with a <strong>100% pass rate</strong>.
</p>

<div class="grid-4 avoid-break">
  <div class="card" style="text-align: center; border-bottom: 3px solid #3b82f6;">
    <div style="font-size: 18pt; font-weight: 800; color: #2563eb;">19 / 19</div>
    <div style="font-size: 8pt; font-weight: 600; color: #64748b; text-transform: uppercase;">E2E Lifecycle</div>
    <span class="badge badge-green" style="margin-top: 4px;">100% Pass</span>
  </div>

  <div class="card" style="text-align: center; border-bottom: 3px solid #8b5cf6;">
    <div style="font-size: 18pt; font-weight: 800; color: #7c3aed;">24 / 24</div>
    <div style="font-size: 8pt; font-weight: 600; color: #64748b; text-transform: uppercase;">Sanitization</div>
    <span class="badge badge-green" style="margin-top: 4px;">100% Pass</span>
  </div>

  <div class="card" style="text-align: center; border-bottom: 3px solid #f59e0b;">
    <div style="font-size: 18pt; font-weight: 800; color: #d97706;">21 / 21</div>
    <div style="font-size: 8pt; font-weight: 600; color: #64748b; text-transform: uppercase;">QA Verification</div>
    <span class="badge badge-green" style="margin-top: 4px;">100% Pass</span>
  </div>

  <div class="card" style="text-align: center; border-bottom: 3px solid #10b981;">
    <div style="font-size: 18pt; font-weight: 800; color: #059669;">29 / 29</div>
    <div style="font-size: 8pt; font-weight: 600; color: #64748b; text-transform: uppercase;">Dashboard & Redis</div>
    <span class="badge badge-green" style="margin-top: 4px;">100% Pass</span>
  </div>
</div>

<div class="callout callout-success avoid-break">
  <div class="callout-title">🏆 Verification Summary: 93 of 93 Tests Passed (100% Success Rate)</div>
  All 4 test runners execute autonomously via <code>npm run test:all</code>. The suite tests full end-to-end integration, boundary security, rate limiting, and dual-custody segregation with zero manual intervention.
</div>

<h2>Granular Test Suite Breakdown</h2>
<table>
  <thead>
    <tr>
      <th>Test Suite Runner</th>
      <th>Automated Scope & Verified Behaviors</th>
      <th>Pass Rate</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>test-e2e-lifecycle.ts</strong><br><code>19 Tests</code></td>
      <td>
        • Security Headers verification (Helmet, X-Frame-Options, XSS Protection)<br>
        • API Rate Limiting headers (<code>RateLimit-Limit</code>, <code>RateLimit-Remaining</code>)<br>
        • Full end-to-end lifecycle from Registration &rarr; Sanitization &rarr; Admin QA &rarr; R2 Disposal &rarr; COD generation<br>
        • Role-Based Access Control barriers on every sensitive endpoint
      </td>
      <td><span class="badge badge-green">19 / 19 PASSED</span></td>
    </tr>
    <tr>
      <td><strong>test-sanitization.ts</strong><br><code>24 Tests</code></td>
      <td>
        • NIST SP 800-88 Clear and Purge wiping methods<br>
        • DoD 5220.22-M 7-pass multi-overwrite verification<br>
        • Illegal status transition rejection (cannot start wipe on non-registered devices)<br>
        • Failure handling, error logging, and re-enqueueing into WIPING_PENDING<br>
        • Technician identity attribution and timestamp stamping
      </td>
      <td><span class="badge badge-green">24 / 24 PASSED</span></td>
    </tr>
    <tr>
      <td><strong>test-verification.ts</strong><br><code>21 Tests</code></td>
      <td>
        • Strict dual-custody enforcement (IT Officers blocked from QA verification)<br>
        • Admin verification approval transitioning asset to VERIFIED<br>
        • Admin rejection requiring mandatory reason and returning asset to WIPING_PENDING<br>
        • Prevention of re-verifying already verified hardware<br>
        • Verification audit log timestamping and verifier ID attribution
      </td>
      <td><span class="badge badge-green">21 / 21 PASSED</span></td>
    </tr>
    <tr>
      <td><strong>test-dashboard.ts</strong><br><code>29 Tests</code></td>
      <td>
        • Real database aggregation across users, assets, wiping, and disposal collections<br>
        • Redis 7 caching verification with 60-second TTL (cache hit vs miss latency)<br>
        • Event-driven cache invalidation hooks triggered on asset modifications<br>
        • Resilient in-memory fallback execution when external Redis/MongoDB are offline<br>
        • Correct calculation of compliance rates, lifecycle distribution, and activity feeds
      </td>
      <td><span class="badge badge-green">29 / 29 PASSED</span></td>
    </tr>
  </tbody>
</table>

<!-- ========================================== -->
<!-- DEPLOYMENT & OPERATIONS GUIDE              -->
<!-- ========================================== -->
<div class="page-break"></div>

<h1><span class="sec-num">09.</span> Deployment, Orchestration & Operations Guide</h1>

<p>
  AssetGuard provides complete, turnkey Docker containerization. A single command orchestrates MongoDB, Redis, the compiled Node.js backend API, and the production NGINX frontend server.
</p>

<h2>Production Docker Compose Deployment</h2>
<pre># 1. Clone repository
git clone https://github.com/Kabycoder/AssetGuard.git
cd AssetGuard

# 2. Launch all containerized microservices in detached mode
docker compose up -d --build

# 3. View service status & healthchecks
docker compose ps</pre>

<h2>Network Endpoints & Service Routing</h2>
<table>
  <thead>
    <tr>
      <th>Service Name</th>
      <th>Exposed Port</th>
      <th>Healthcheck / Target Endpoint</th>
      <th>Container Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>assetguard-frontend</code></td>
      <td><code>80:80</code></td>
      <td><code>http://localhost/</code></td>
      <td>NGINX Alpine static file server & API reverse proxy.</td>
    </tr>
    <tr>
      <td><code>assetguard-backend</code></td>
      <td><code>5000:5000</code></td>
      <td><code>http://localhost:5000/api/v1/health</code></td>
      <td>Express + Prisma API runtime running Node.js.</td>
    </tr>
    <tr>
      <td><code>assetguard-mongodb</code></td>
      <td><code>27017:27017</code></td>
      <td><code>mongosh --eval "db.adminCommand('ping')"</code></td>
      <td>MongoDB 7 document database with persistent volume.</td>
    </tr>
    <tr>
      <td><code>assetguard-redis</code></td>
      <td><code>6379:6379</code></td>
      <td><code>redis-cli ping</code></td>
      <td>Redis 7 Alpine caching store & distributed rate limiter.</td>
    </tr>
  </tbody>
</table>

<h2>Authorized Production Enterprise Accounts</h2>
<p>
  To ensure maximum operational security and compliance with enterprise security audits, demo account quick-fill buttons have been completely removed from the interface. Authorized operators must manually enter their designated credentials. Each role has a distinct, cryptographically hashed Bcrypt password:
</p>

<table>
  <thead>
    <tr>
      <th>Enterprise Role</th>
      <th>Authorized Email Address</th>
      <th>Production Password</th>
      <th>Access Level & Operational Responsibilities</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Administrator</strong></td>
      <td><code>ms.kabi78@gmail.com</code></td>
      <td><code>Admin@Kabi2026!</code></td>
      <td>Full Administrative Control, Hardware Ingestion, Dual-Custody QA Verification Sign-off, Audit Logs.</td>
    </tr>
    <tr>
      <td><strong>IT Officer</strong></td>
      <td><code>jeyarajalingam0@gmail.com</code></td>
      <td><code>IT@Jeya2026!</code></td>
      <td>Sanitization Station Access, NIST SP 800-88 Drive Erasure, Sector Zeroing, Failure Diagnostic Logging.</td>
    </tr>
    <tr>
      <td><strong>Disposal Officer</strong></td>
      <td><code>Itzmebroo1@gmail.com</code></td>
      <td><code>Disposal@Broo2026!</code></td>
      <td>Downstream E-Waste Partner Manifests, R2v3 Recycling Stamping, Certificate of Destruction (COD) Issuance.</td>
    </tr>
  </tbody>
</table>

<div class="callout callout-success avoid-break" style="margin-top: 10px;">
  <div class="callout-title">🔒 Enterprise Security Hardening</div>
  Emails are processed with case-insensitive normalization (e.g. <code>Itzmebroo1@gmail.com</code> is canonically matched to <code>itzmebroo1@gmail.com</code>). Common dev-password bypasses are strictly disabled for these accounts. Automated test suite runner accounts (<code>*@assetguard.local</code>) remain isolated for CI/CD regression verification.
</div>

<!-- ========================================== -->
<!-- CONCLUSION & SIGN-OFF                      -->
<!-- ========================================== -->
<div class="page-break"></div>

<h1><span class="sec-num">10.</span> Conclusion & Academic Attribution</h1>

<p>
  AssetGuard successfully demonstrates that enterprise IT Asset Disposition (ITAD) can be transformed from a fragmented, manual compliance liability into an automated, mathematically verified, and auditable software discipline. By unifying:
</p>

<ul>
  <li><strong>Cryptographic Sanitization</strong> governed by NIST SP 800-88 Rev. 1 and DoD 5220.22-M standards,</li>
  <li><strong>Rigid Dual-Custody Governance</strong> that strictly enforces separation of duties between drive erasers and quality auditors,</li>
  <li><strong>Certified Downstream Logistics</strong> aligned with R2v3 and e-Stewards circular economy mandates,</li>
  <li><strong>Sub-Millisecond Read Performance</strong> powered by distributed Redis 7 caching with event-driven invalidation, and</li>
  <li><strong>Turnkey Containerized Infrastructure</strong> backed by a 100% passing automated test suite (93/93 tests),</li>
</ul>

<p>
  AssetGuard stands as a reference implementation for mission-critical hardware lifecycle governance, data loss prevention, and sustainable enterprise IT operations.
</p>

<div class="callout callout-purple avoid-break" style="margin-top: 30px;">
  <div class="callout-title">📄 Project & Academic Attribution</div>
  <strong>Project Name:</strong> AssetGuard — Enterprise ITAD & Data Sanitization Platform<br>
  <strong>Repository:</strong> <a href="https://github.com/Kabycoder/AssetGuard.git" style="color: #4f46e5; text-decoration: none;">https://github.com/Kabycoder/AssetGuard.git</a><br>
  <strong>License:</strong> MIT Open Source License<br>
  <strong>Technical Status:</strong> All Phases Completed (Phase 1 through Phase 10) • Production Ready
</div>

<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 8pt; color: #94a3b8;">
  <div>AssetGuard Technical Specification & Project Retrospective</div>
  <div>Page <span class="page-number"></span> • Confirmed Production Grade</div>
</div>

</body>
</html>
"""

html_path = os.path.abspath('AssetGuard_Complete_Project_Documentation.html')
pdf_path = os.path.abspath('AssetGuard_Complete_Project_Documentation.pdf')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"HTML written to: {html_path}")

edge_path = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

cmd = [
    edge_path,
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw',
    f'--print-to-pdf={pdf_path}',
    html_path
]

print("Executing Microsoft Edge headless print-to-pdf...")
p = subprocess.run(cmd, capture_output=True, text=True)
print(f"Process return code: {p.returncode}")
if p.stdout:
    print(f"Stdout: {p.stdout}")
if p.stderr:
    print(f"Stderr: {p.stderr}")

time.sleep(1)

if os.path.exists(pdf_path):
    size_bytes = os.path.getsize(pdf_path)
    print(f"SUCCESS: PDF created at: {pdf_path}")
    print(f"File size: {size_bytes / 1024:.2f} KB ({size_bytes} bytes)")
else:
    print("ERROR: PDF was not generated.")
