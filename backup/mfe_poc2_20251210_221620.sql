--
-- PostgreSQL database dump
--

\restrict UtSLlILKAqounCOQY27K22TDC5D7bAcLOJKKPf5cQB5hImxbP62G2IMOy4uFZTs

-- Dumped from database version 16.11 (Debian 16.11-1.pgdg13+1)
-- Dumped by pg_dump version 16.11 (Debian 16.11-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentType" AS ENUM (
    'instant',
    'scheduled',
    'recurring'
);


ALTER TYPE public."PaymentType" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'CUSTOMER',
    'VENDOR'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    user_id text,
    action text NOT NULL,
    resource_type text,
    resource_id text,
    details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_transactions (
    id text NOT NULL,
    payment_id text NOT NULL,
    status public."PaymentStatus" NOT NULL,
    status_message text,
    psp_transaction_id text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.payment_transactions OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id text NOT NULL,
    sender_id text NOT NULL,
    recipient_id text,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    status public."PaymentStatus" NOT NULL,
    type public."PaymentType" NOT NULL,
    description text,
    metadata jsonb,
    psp_transaction_id text,
    psp_status text,
    failure_reason text,
    completed_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id text NOT NULL,
    user_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: system_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_config (
    key text NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by text
);


ALTER TABLE public.system_config OWNER TO postgres;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id text NOT NULL,
    user_id text NOT NULL,
    avatar_url text,
    phone text,
    address text,
    bio text,
    preferences jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    name text NOT NULL,
    role public."UserRole" NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
a3e6ff40-5db0-49e7-bb13-bd855fe18388	63daa3e79a010adca69137566263cd84e95da556510d2e2b32f4d65ef41d152b	2025-12-08 15:59:47.313888+00	20251208155947_init	\N	\N	2025-12-08 15:59:47.233083+00	1
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) FROM stdin;
002e7dfd-acfa-482a-ac10-a6658b8a2abc	e1633730-e831-4447-8634-380aea25ca4b	user.created	user	cf855371-f941-44b7-acbb-690509665ac3	{"role": "CUSTOMER", "email": "customer@example.com"}	127.0.0.1	Prisma Seed Script	2025-12-08 16:05:26.665
\.


--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_transactions (id, payment_id, status, status_message, psp_transaction_id, metadata, created_at) FROM stdin;
d31d2ba6-845d-4b45-8d1f-0d5a03b986cf	64f05958-c2d0-4a81-8f35-8af4ebfabe32	completed	Payment completed successfully	PSP_TX_123	{"timestamp": "2025-12-08T16:05:26.659Z"}	2025-12-08 16:05:26.66
5462b17f-ebc3-4368-a904-9c0b6fcecb09	3fd047a8-2e4c-4bc3-ba06-bb1b003e8f72	pending	Payment initiated	PSP_TX_456	{"timestamp": "2025-12-08T16:05:26.661Z"}	2025-12-08 16:05:26.662
18a7b3c1-3fcc-49c0-a111-9ec1976b34fd	5f2bb809-7e9d-48c3-b619-fe8a47bf7b41	pending	Payment created	\N	\N	2025-12-08 16:06:25.729
d1657b37-1e35-4fab-a75a-0030bee4c124	3fd047a8-2e4c-4bc3-ba06-bb1b003e8f72	completed	Test completion	\N	\N	2025-12-08 16:06:25.754
57702aab-da39-4302-a3e1-4755ab7e7a70	616473b3-dd5a-461d-b4f9-3d6f6205af97	pending	Payment created	\N	\N	2025-12-10 04:13:08.35
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, sender_id, recipient_id, amount, currency, status, type, description, metadata, psp_transaction_id, psp_status, failure_reason, completed_at, created_at, updated_at) FROM stdin;
64f05958-c2d0-4a81-8f35-8af4ebfabe32	cf855371-f941-44b7-acbb-690509665ac3	f1e76de5-7026-44bc-9307-5fcab76ea552	1000.00	USD	completed	instant	Sample instant payment	{"source": "test"}	\N	\N	\N	2025-12-08 16:05:26.653	2025-12-08 16:05:26.654	2025-12-08 16:05:26.654
5f2bb809-7e9d-48c3-b619-fe8a47bf7b41	e1633730-e831-4447-8634-380aea25ca4b	f1e76de5-7026-44bc-9307-5fcab76ea552	250.50	USD	pending	instant	Test payment	\N	\N	\N	\N	\N	2025-12-08 16:06:25.72	2025-12-08 16:06:25.72
3fd047a8-2e4c-4bc3-ba06-bb1b003e8f72	f1e76de5-7026-44bc-9307-5fcab76ea552	cf855371-f941-44b7-acbb-690509665ac3	500.00	USD	completed	scheduled	Sample scheduled payment	{"source": "test"}	\N	\N	\N	2025-12-08 16:06:25.746	2025-12-08 16:05:26.658	2025-12-08 16:06:25.747
616473b3-dd5a-461d-b4f9-3d6f6205af97	a70f3876-201b-4cdc-b3df-83e9130ec873	3b37ee13-e681-42a4-b761-7a81a8a45f36	50.00	USD	pending	instant	Test instant payment	\N	\N	\N	\N	\N	2025-12-10 04:13:08.335	2025-12-10 04:13:08.335
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
58eca0c2-535b-45d1-870e-a565381775d8	cf855371-f941-44b7-acbb-690509665ac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjZjg1NTM3MS1mOTQxLTQ0YjctYWNiYi02OTA1MDk2NjVhYzMiLCJlbWFpbCI6ImN1c3RvbWVyQGV4YW1wbGUuY29tIiwibmFtZSI6IkN1c3RvbWVyIFVzZXIiLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NjUyMTMwMzksImV4cCI6MTc2NTgxNzgzOX0.nC-KldF7PqVabM4H0DiMQjCipE2awOWPLSc3KTvn1AQ	2025-12-15 16:57:19.252	2025-12-08 16:57:19.253
f98c1b0d-2c4e-4854-b1d0-286c68766ad0	e1633730-e831-4447-8634-380aea25ca4b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMTYzMzczMC1lODMxLTQ0NDctODYzNC0zODBhZWEyNWNhNGIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwibmFtZSI6IkFkbWluIFVzZXIiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjUzMTYxMjMsImV4cCI6MTc2NTkyMDkyM30.A7Eu2JHqZJ7M50Nurj3zZ57vfmR4aXL7GMRg1NEVGaY	2025-12-16 21:35:23.761	2025-12-09 21:35:23.762
647329de-0a85-427b-8d50-99946a72d24e	10ba7dbf-ce13-4ae8-823a-a6854b50d8ee	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMGJhN2RiZi1jZTEzLTRhZTgtODIzYS1hNjg1NGI1MGQ4ZWUiLCJlbWFpbCI6InF1aWNrdGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJRdWljayBUZXN0Iiwicm9sZSI6IkNVU1RPTUVSIiwiaWF0IjoxNzY1MjYzNTM3LCJleHAiOjE3NjU4NjgzMzd9.y2SOq7VYWUiVgx6huNdbEETj0VvH3mz-ueiQhvvjxDw	2025-12-16 06:58:57.383	2025-12-09 06:58:57.383
3fc0d386-0577-4dc0-8dc8-fa350bf62edf	071008d3-7660-4450-84a9-5b25382be429	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNzEwMDhkMy03NjYwLTQ0NTAtODRhOS01YjI1MzgyYmU0MjkiLCJlbWFpbCI6ImRpcmVjdDE3NjUyNjQyNThAdGVzdC5jb20iLCJuYW1lIjoiRGlyZWN0IFRlc3QiLCJyb2xlIjoiQ1VTVE9NRVIiLCJpYXQiOjE3NjUyNjQyNTgsImV4cCI6MTc2NTg2OTA1OH0.y5YQfexjMSRg3kVHjufxbdioM4LEm4zB9_e-dB-OGeM	2025-12-16 07:10:58.568	2025-12-09 07:10:58.568
a02bbb76-cb7c-4de2-81ac-8d5f914d3e78	193ef369-6793-48d2-a024-f850b161d209	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxOTNlZjM2OS02NzkzLTQ4ZDItYTAyNC1mODUwYjE2MWQyMDkiLCJlbWFpbCI6ImRpcmVjdDE3NjUyNjQyNzZAdGVzdC5jb20iLCJuYW1lIjoiRGlyZWN0Iiwicm9sZSI6IkNVU1RPTUVSIiwiaWF0IjoxNzY1MjY0Mjc2LCJleHAiOjE3NjU4NjkwNzZ9.ssN4YdYISXcxHkQnMrrVFBRF8uGZrpcbLqtZO-2jcso	2025-12-16 07:11:16.795	2025-12-09 07:11:16.796
9185414b-9b0c-4a04-9623-a90c26b6bb48	a74c26b2-d63e-4f03-ad7d-dbbdc96a982d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNzRjMjZiMi1kNjNlLTRmMDMtYWQ3ZC1kYmJkYzk2YTk4MmQiLCJlbWFpbCI6ImZpbmFsdXNlcjE3NjUyNjY3NzJAdGVzdC5jb20iLCJuYW1lIjoiRmluYWwgVXNlciIsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc2NTI2NjkwNywiZXhwIjoxNzY1ODcxNzA3fQ.nwwTBceQ-0NZ2q5wv3aTTmy7wlQA1DJ0s5CgwtiHrQ8	2025-12-16 07:55:07.161	2025-12-09 07:55:07.161
ea4513d4-d9e2-4f49-ab4e-6aa5135f60f3	a70f3876-201b-4cdc-b3df-83e9130ec873	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhNzBmMzg3Ni0yMDFiLTRjZGMtYjNkZi04M2U5MTMwZWM4NzMiLCJlbWFpbCI6InBhdGVhdGxhdUBnbWFpbC5jb20iLCJuYW1lIjoiUGF0ZWEgVGxhdSIsInJvbGUiOiJWRU5ET1IiLCJpYXQiOjE3NjUzNDIwNjMsImV4cCI6MTc2NTk0Njg2M30.yLm036bxskHArWynMiDl0HF8sTk9897yMf6OOXhWCiY	2025-12-17 04:47:43.276	2025-12-10 04:47:43.277
092a5872-e1e1-43d2-b8b6-58d722ba0ba3	3b37ee13-e681-42a4-b761-7a81a8a45f36	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzYjM3ZWUxMy1lNjgxLTQyYTQtYjc2MS03YTgxYThhNDVmMzYiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsIm5hbWUiOiJOZXcgQWRtaW4iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjUzNzM3MDAsImV4cCI6MTc2NTk3ODUwMH0.lSyc4krKc9mQFBgP9ka3lXGzx_ynMhE9eHko-6kP4Cc	2025-12-17 13:35:00.719	2025-12-10 13:35:00.721
\.


--
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_config (key, value, description, updated_at, updated_by) FROM stdin;
app.version	"1.0.0"	Application version	2025-12-08 16:05:26.662	e1633730-e831-4447-8634-380aea25ca4b
payment.min_amount	0.01	Minimum payment amount	2025-12-08 16:05:26.664	e1633730-e831-4447-8634-380aea25ca4b
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_profiles (id, user_id, avatar_url, phone, address, bio, preferences, created_at, updated_at) FROM stdin;
de504764-3607-4236-91c1-8bda9273ca49	cf855371-f941-44b7-acbb-690509665ac3	\N	+1234567891	\N	\N	{"theme": "light", "notifications": true}	2025-12-08 16:05:26.649	2025-12-08 16:05:26.649
d170828b-b3f0-41ff-b516-b5ec911f3dd9	f1e76de5-7026-44bc-9307-5fcab76ea552	\N	+1234567892	456 Vendor Avenue	\N	{"theme": "light", "notifications": false}	2025-12-08 16:05:26.651	2025-12-08 16:05:26.651
577d3f24-e86e-42c1-857e-cc4ccaba02b2	e1633730-e831-4447-8634-380aea25ca4b	\N	+1234567890	123 Main St	Test bio	{"theme": "dark", "currency": "USD", "language": "en-US", "notifications": {"push": false, "email": true}}	2025-12-08 16:05:26.646	2025-12-09 01:39:10.32
d5b11cc9-7f4e-476d-9565-b62f7013a75b	10ba7dbf-ce13-4ae8-823a-a6854b50d8ee	\N	\N	\N	\N	\N	2025-12-09 06:58:56.961	2025-12-09 06:58:56.961
a637522b-12ab-473c-84c6-5717a2fbad96	071008d3-7660-4450-84a9-5b25382be429	\N	\N	\N	\N	\N	2025-12-09 07:10:58.563	2025-12-09 07:10:58.563
91f93f3a-0b69-4b2a-885b-ce55cbe68127	193ef369-6793-48d2-a024-f850b161d209	\N	\N	\N	\N	\N	2025-12-09 07:11:16.787	2025-12-09 07:11:16.787
37783d99-8663-4fe2-a1a3-1f8e65d1a8a9	a74c26b2-d63e-4f03-ad7d-dbbdc96a982d	\N	\N	\N	\N	\N	2025-12-09 07:52:52.587	2025-12-09 07:52:52.587
ee7246a1-af5a-4b38-bde4-ca9c8783536a	a70f3876-201b-4cdc-b3df-83e9130ec873	\N	\N	\N	\N	\N	2025-12-09 09:54:26.865	2025-12-09 09:54:26.865
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, name, role, email_verified, created_at, updated_at) FROM stdin;
f1e76de5-7026-44bc-9307-5fcab76ea552	vendor@example.com	$2b$10$SAHx2z3D2pf7zROJzEgRw.witqPj0ffnzgbuNLcWOm9rYNmO5vyXK	Admin User Updated	VENDOR	t	2025-12-08 16:05:26.645	2025-12-08 16:57:19.1
cf855371-f941-44b7-acbb-690509665ac3	customer@example.com	$2b$10$SAHx2z3D2pf7zROJzEgRw.witqPj0ffnzgbuNLcWOm9rYNmO5vyXK	Customer User	CUSTOMER	t	2025-12-08 16:05:26.643	2025-12-08 16:57:19.157
e1633730-e831-4447-8634-380aea25ca4b	admin@example.com	$2b$10$DZb1Z4NjMXlSq2ToSwqq0uMw0m4ixzMP5E2/2ClBkjXm9fQB4Cltu	Admin User	ADMIN	t	2025-12-08 16:05:26.635	2025-12-09 01:31:50.087
10ba7dbf-ce13-4ae8-823a-a6854b50d8ee	quicktest@example.com	$2b$10$HeSWSOPrgMUMorxSTINB.O9UIn0TUGx84/SJa/bBxsot0wSpLxdfW	Quick Test	CUSTOMER	f	2025-12-09 06:58:56.95	2025-12-09 06:58:56.95
071008d3-7660-4450-84a9-5b25382be429	direct1765264258@test.com	$2b$10$9BrBA2B108BftH8e9x1/d.HAu4JyqtX3XrTwAsRLuJ4yOxEeMXspq	Direct Test	CUSTOMER	f	2025-12-09 07:10:58.557	2025-12-09 07:10:58.557
193ef369-6793-48d2-a024-f850b161d209	direct1765264276@test.com	$2b$10$Jl/4h6UAnZRmtr4Kd7MayuNH4EXibgU7GSq6Uqrn3dzdZsZu2XOgC	Direct	CUSTOMER	f	2025-12-09 07:11:16.78	2025-12-09 07:11:16.78
a74c26b2-d63e-4f03-ad7d-dbbdc96a982d	finaluser1765266772@test.com	$2b$10$o2l4kL2iv/Zyd2hAAYuHZ.eopQgvAQ6NNx7O6djpJogdt4iS5YWRC	Final User	CUSTOMER	f	2025-12-09 07:52:52.577	2025-12-09 07:52:52.577
3b37ee13-e681-42a4-b761-7a81a8a45f36	admin@gmail.com	$2b$10$bFGOczwxCpNPUqrdTPFBHuI4v8v4Saug0xe0cF/hxH8j9.Sg7oYK6	New Admin	ADMIN	f	2025-12-09 21:37:59.38	2025-12-09 21:37:59.38
a70f3876-201b-4cdc-b3df-83e9130ec873	pateatlau@gmail.com	$2b$10$MPg8JRHHf/6OWM85zKYqF.D.6PlH3mZfKq2tkYOyArrW48jUmj0ju	Patea Tlau	VENDOR	f	2025-12-09 09:54:26.853	2025-12-10 04:11:20.011
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (key);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: payment_transactions_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_transactions_created_at_idx ON public.payment_transactions USING btree (created_at);


--
-- Name: payment_transactions_payment_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payment_transactions_payment_id_idx ON public.payment_transactions USING btree (payment_id);


--
-- Name: payments_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_created_at_idx ON public.payments USING btree (created_at);


--
-- Name: payments_recipient_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_recipient_id_idx ON public.payments USING btree (recipient_id);


--
-- Name: payments_sender_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_sender_id_idx ON public.payments USING btree (sender_id);


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: refresh_tokens_token_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refresh_tokens_token_idx ON public.refresh_tokens USING btree (token);


--
-- Name: refresh_tokens_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX refresh_tokens_token_key ON public.refresh_tokens USING btree (token);


--
-- Name: refresh_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX refresh_tokens_user_id_idx ON public.refresh_tokens USING btree (user_id);


--
-- Name: user_profiles_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_profiles_user_id_idx ON public.user_profiles USING btree (user_id);


--
-- Name: user_profiles_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_profiles_user_id_key ON public.user_profiles USING btree (user_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_role_idx ON public.users USING btree (role);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payment_transactions payment_transactions_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: payments payments_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict UtSLlILKAqounCOQY27K22TDC5D7bAcLOJKKPf5cQB5hImxbP62G2IMOy4uFZTs

