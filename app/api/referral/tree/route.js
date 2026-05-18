import { ReferralsController } from '@/modules/referrals/referrals.controller.js';

export async function GET(req) {
  return await ReferralsController.getTree(req);
}
