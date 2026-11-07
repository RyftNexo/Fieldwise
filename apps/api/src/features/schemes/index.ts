// STUB — serves the contract fixtures. D2-02 replaces this with a seeded `schemes` table of verified facts.
import { endpoints, schemeFixtures } from '@app/shared';
import { Hono } from 'hono';
import { reply } from '../../lib/http';

export const router = new Hono();

// C-05
router.get(endpoints.listSchemes.path, (c) => reply(c, endpoints.listSchemes, schemeFixtures));
