// D2-02 moves the catalogue into a seeded `schemes` table; until then C-05 serves the verified list from code.
import { endpoints } from '@app/shared';
import { Hono } from 'hono';
import { reply } from '../../lib/http';
import { schemeCatalogue } from './catalogue';

export const router = new Hono();

// C-05
router.get(endpoints.listSchemes.path, (c) => reply(c, endpoints.listSchemes, schemeCatalogue));
