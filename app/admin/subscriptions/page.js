import { dbConnect } from "@/config/database";
import SubscriptionPlan from "@/models/subscriptionPlan.model";
import { Plus, MoreHorizontal, Check, X, IndianRupee, Layers, Star } from "lucide-react";

async function getPlans() {
  await dbConnect();
  // Fetch active and inactive plans
  const plans = await SubscriptionPlan.find()
    .sort({ sortOrder: 1, price: 1 })
    .lean();
  
  return JSON.parse(JSON.stringify(plans)); // Serialize for client
}

export default async function SubscriptionsPage() {
  const plans = await getPlans();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">Subscription Plans</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage vendor subscription tiers and pricing.</p>
        </div>
        
        <button className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-white transition-colors shadow-sm">
          <Plus size={16} />
          Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
        {plans.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            No subscription plans found. Create one to get started.
          </div>
        ) : (
          plans.map((plan) => (
            <div 
              key={plan._id} 
              className={`bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border transition-all relative overflow-hidden
                ${plan.isPopular ? 'border-blue-500 ring-1 ring-blue-500' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}
              `}
            >
              {plan.isPopular && (
                <div className="absolute top-0 inset-x-0 h-1 bg-blue-500"></div>
              )}
              
              {!plan.isActive && (
                <div className="absolute top-4 right-4 px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded dark:bg-red-900/30 dark:text-red-400">
                  Inactive
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  {plan.badge && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3">
                      {plan.badge.replace('_', ' ')}
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{plan.name}</h3>
                  <p className="text-sm text-zinc-500 mt-1 h-10 line-clamp-2">{plan.description}</p>
                </div>
              </div>

              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center">
                    {plan.currency === 'INR' ? <IndianRupee size={24} className="mr-1" /> : '$'}
                    {plan.price}
                  </span>
                  <span className="text-zinc-500 text-sm font-medium">/ {plan.billingCycle.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <Layers size={16} className="text-blue-500" />
                  <span className="font-semibold">{plan.creditsIncluded}</span> Ad Credits
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <Star size={16} className="text-yellow-500" />
                  Max <span className="font-semibold">{plan.maxAds === 0 ? 'Unlimited' : plan.maxAds}</span> Active Ads
                </div>
                
                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-4"></div>
                
                <ul className="space-y-2">
                  {plan.features?.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {feature.included ? (
                        <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <X size={16} className="text-zinc-300 dark:text-zinc-600 shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? "" : "text-zinc-400 dark:text-zinc-500"}>
                        {feature.label}
                      </span>
                    </li>
                  ))}
                  {(plan.features?.length > 4) && (
                    <li className="text-xs text-zinc-400 pl-6 italic">+{plan.features.length - 4} more features</li>
                  )}
                </ul>
              </div>

              <div className="mt-auto pt-4 flex gap-2">
                <button className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors
                  ${plan.isPopular 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200'
                  }`}
                >
                  Edit Plan
                </button>
                <button className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-400 transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
