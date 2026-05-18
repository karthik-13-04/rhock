import { ReferralsController } from '@/modules/referrals/referrals.controller.js';

export async function POST(req) {
  return await ReferralsController.generateLink(req);
}
