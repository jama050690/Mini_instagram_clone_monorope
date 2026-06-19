import { Relationship } from '../users/profile-view.serializer';

/**
 * Follow amalidan keyingi viewer→target munosabati. FE follow tugmasini shu
 * bo'yicha yangilaydi (profil `relationship` bilan bir xil enum).
 */
export interface FollowState {
  relationship: Relationship;
}
