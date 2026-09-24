"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function saveCrrcEvaluation(
  applicationId: string,
  data: {
    // KRA I - Instruction (max 100 points)
    kra1TeachingEffectiveness?: number | null; // max 60
    kra1CurriculumMaterials?: number | null; // max 30
    kra1SpecialProjects?: number | null; // max 10

    // KRA II - Research, Innovation, and/or Creative Work (max 100 points)
    kra2ResearchOutputs?: number | null; // max 100
    kra2Inventions?: number | null; // max 100
    kra2CreativeWorks?: number | null; // max 100

    // KRA III - Extension Services (max 100 points)
    kra3ServiceToInstitution?: number | null; // max 30
    kra3ServiceToCommunity?: number | null; // max 50
    kra3QualityOfService?: number | null; // max 20
    kra3Bonus?: number | null; // max 20, additive

    // KRA IV - Professional Development (max 100 points)
    kra4ProfessionalOrgs?: number | null; // max 20
    kra4ContinuingDevelopment?: number | null; // max 60
    kra4AwardsRecognition?: number | null; // max 20
    kra4NewHireBonus?: number | null; // max 20, newly hired faculty only

    notes?: string;
  }
) {
  const user = await getCurrentUser(undefined);
  if (!user || user.role !== "dean") throw new Error("Unauthorized");

  // Calculate KRA totals
  const kra1Total = ((data.kra1TeachingEffectiveness ?? 0) +
                     (data.kra1CurriculumMaterials ?? 0) +
                     (data.kra1SpecialProjects ?? 0));

  // For KRA II, we'll use a simple sum for v1 (to be updated with proper Annex I rules)
  const kra2Total = (data.kra2ResearchOutputs ?? 0) +
                    (data.kra2Inventions ?? 0) +
                    (data.kra2CreativeWorks ?? 0);

  const kra3Total = (data.kra3ServiceToInstitution ?? 0) +
                    (data.kra3ServiceToCommunity ?? 0) +
                    (data.kra3QualityOfService ?? 0) +
                    (data.kra3Bonus ?? 0);

  const kra4Total = (data.kra4ProfessionalOrgs ?? 0) +
                    (data.kra4ContinuingDevelopment ?? 0) +
                    (data.kra4AwardsRecognition ?? 0) +
                    (data.kra4NewHireBonus ?? 0);

  // For v1, we'll use the simple average of KRA totals as the final score
  // This should be updated with proper rank-based weighting when available
  const finalWeightedScore = (kra1Total + kra2Total + kra3Total + kra4Total) / 4;

  // Check if CrrcEvaluation already exists
  const existingEvaluation = await prisma.crrcEvaluation.findUnique({
    where: { applicationId }
  });

  let crrcEvaluation;
  if (existingEvaluation) {
    // Update existing
    crrcEvaluation = await prisma.crrcEvaluation.update({
      where: { applicationId },
      data: {
        // KRA I
        kra1TeachingEffectiveness: data.kra1TeachingEffectiveness,
        kra1CurriculumMaterials: data.kra1CurriculumMaterials,
        kra1SpecialProjects: data.kra1SpecialProjects,
        kra1Total,

        // KRA II
        kra2ResearchOutputs: data.kra2ResearchOutputs,
        kra2Inventions: data.kra2Inventions,
        kra2CreativeWorks: data.kra2CreativeWorks,
        kra2Total,

        // KRA III
        kra3ServiceToInstitution: data.kra3ServiceToInstitution,
        kra3ServiceToCommunity: data.kra3ServiceToCommunity,
        kra3QualityOfService: data.kra3QualityOfService,
        kra3Bonus: data.kra3Bonus,
        kra3Total,

        // KRA IV
        kra4ProfessionalOrgs: data.kra4ProfessionalOrgs,
        kra4ContinuingDevelopment: data.kra4ContinuingDevelopment,
        kra4AwardsRecognition: data.kra4AwardsRecognition,
        kra4NewHireBonus: data.kra4NewHireBonus,
        kra4Total,

        finalWeightedScore,
        notes: data.notes,
        evaluatedById: user.id,
        updatedAt: new Date()
      }
    });
  } else {
    // Create new
    crrcEvaluation = await prisma.crrcEvaluation.create({
      data: {
        applicationId,
        // KRA I
        kra1TeachingEffectiveness: data.kra1TeachingEffectiveness,
        kra1CurriculumMaterials: data.kra1CurriculumMaterials,
        kra1SpecialProjects: data.kra1SpecialProjects,
        kra1Total,

        // KRA II
        kra2ResearchOutputs: data.kra2ResearchOutputs,
        kra2Inventions: data.kra2Inventions,
        kra2CreativeWorks: data.kra2CreativeWorks,
        kra2Total,

        // KRA III
        kra3ServiceToInstitution: data.kra3ServiceToInstitution,
        kra3ServiceToCommunity: data.kra3ServiceToCommunity,
        kra3QualityOfService: data.kra3QualityOfService,
        kra3Bonus: data.kra3Bonus,
        kra3Total,

        // KRA IV
        kra4ProfessionalOrgs: data.kra4ProfessionalOrgs,
        kra4ContinuingDevelopment: data.kra4ContinuingDevelopment,
        kra4AwardsRecognition: data.kra4AwardsRecognition,
        kra4NewHireBonus: data.kra4NewHireBonus,
        kra4Total,

        finalWeightedScore,
        notes: data.notes,
        evaluatedById: user.id
      }
    });
  }

  // Update the denormalized crrcScore on Application for backward compatibility
  await prisma.application.update({
    where: { id: applicationId },
    data: { crrcScore: finalWeightedScore }
  });

  return crrcEvaluation;
}