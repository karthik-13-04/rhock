import { RedemptionsController } from '@/modules/redemptions/redemptions.controller.js';

export async function GET(req) {
  return await RedemptionsController.getPending(req);
}
