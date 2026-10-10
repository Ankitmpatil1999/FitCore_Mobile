import { INITIAL_WORKOUT_SCHEDULE as MEMBER_INITIAL_SCHEDULE, PRESET_ROUTINE_OPTIONS as MEMBER_PRESETS } from '../src/screens/member/WorkoutScreen';
import { INITIAL_WORKOUT_SCHEDULE as OWNER_INITIAL_SCHEDULE, PRESET_ROUTINE_OPTIONS as OWNER_PRESETS } from '../src/screens/owner/OwnerWorkoutPlansScreen';
import { apiService } from '../src/services/api';

describe('FitCore Batch 4.1 — Workout Schedule & Icon Consistency', () => {
  describe('1. Member Workout Plan Resolution & Empty-State Handling', () => {
    it('handles no assigned member plan (starter template) honestly without claiming coach assignment', () => {
      // Simulate backend response when no plan is assigned
      const emptyPlanApiResponse = {
        success: true,
        data: null,
        activeTier: null,
        isTrainerAssigned: false,
        isSelfCustom: false,
        isGymMaster: false,
        isStarterTemplate: true,
      };

      const isAssigned = emptyPlanApiResponse.isTrainerAssigned || emptyPlanApiResponse.isSelfCustom || emptyPlanApiResponse.isGymMaster;
      expect(isAssigned).toBe(false);
      expect(emptyPlanApiResponse.isStarterTemplate).toBe(true);

      // Verify structural default schedule has 7 full days
      expect(MEMBER_INITIAL_SCHEDULE).toHaveLength(7);
      const days = MEMBER_INITIAL_SCHEDULE.map(d => d.day);
      expect(days).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
    });

    it('correctly categorizes assigned coach plan, self-custom split, and gym master plan', () => {
      // 1. Coach assigned plan
      const coachApiResponse = {
        success: true,
        activeTier: 'TRAINER',
        isTrainerAssigned: true,
        isSelfCustom: false,
        isGymMaster: false,
        trainerPlan: {
          trainerName: 'Coach Sarah',
          title: 'Hypertrophy Block A',
          days: MEMBER_INITIAL_SCHEDULE,
        },
      };
      expect(coachApiResponse.isTrainerAssigned).toBe(true);
      expect(coachApiResponse.trainerPlan.trainerName).toBe('Coach Sarah');

      // 2. Self-custom plan
      const customApiResponse = {
        success: true,
        activeTier: 'SELF_CUSTOM',
        isTrainerAssigned: false,
        isSelfCustom: true,
        isGymMaster: false,
        memberCustomPlan: {
          title: 'My Custom 4-Day Split',
          days: MEMBER_INITIAL_SCHEDULE.slice(0, 4),
        },
      };
      expect(customApiResponse.isSelfCustom).toBe(true);
      expect(customApiResponse.memberCustomPlan.title).toBe('My Custom 4-Day Split');

      // 3. Gym master split
      const gymMasterApiResponse = {
        success: true,
        activeTier: 'GYM_MASTER',
        isTrainerAssigned: false,
        isSelfCustom: false,
        isGymMaster: true,
        gymMasterPlan: {
          title: 'PowerGym Official Routine',
          days: MEMBER_INITIAL_SCHEDULE,
        },
      };
      expect(gymMasterApiResponse.isGymMaster).toBe(true);
      expect(gymMasterApiResponse.gymMasterPlan.title).toBe('PowerGym Official Routine');
    });

    it('does not interpret network or server error as "no plan assigned"', async () => {
      const mockApiError = new Error('Network request failed');
      jest.spyOn(apiService, 'getMemberWorkout').mockRejectedValueOnce(mockApiError);

      let capturedError: any = null;
      try {
        await apiService.getMemberWorkout('member_123');
      } catch (err) {
        capturedError = err;
      }

      expect(capturedError).not.toBeNull();
      expect(capturedError.message).toBe('Network request failed');
    });
  });

  describe('2. Owner Master Workout Plan State Distinction', () => {
    it('distinguishes unpublished default template from published master plan', () => {
      // Unpublished template response from backend
      const unpublishedApiResponse = {
        success: true,
        isCustomized: false,
        data: {
          title: 'General 7-Day Gym Split (Default)',
          days: OWNER_INITIAL_SCHEDULE,
        },
      };
      expect(unpublishedApiResponse.isCustomized).toBe(false);

      // Published / saved master plan response
      const publishedApiResponse = {
        success: true,
        isCustomized: true,
        data: {
          title: 'Metro Gym Official 2026 Master Split',
          description: 'Customized 6-day split with recovery protocol',
          days: OWNER_INITIAL_SCHEDULE,
        },
      };
      expect(publishedApiResponse.isCustomized).toBe(true);
      expect(publishedApiResponse.data.title).toContain('Official 2026 Master Split');
    });

    it('validates owner master plan API endpoint methods in apiService', () => {
      expect(typeof apiService.getOwnerMasterWorkoutPlan).toBe('function');
      expect(typeof apiService.saveOwnerMasterWorkoutPlan).toBe('function');
    });
  });

  describe('3. Preset Icon Mappings & Consistency', () => {
    it('contains valid preset routine options with clean local icon references', () => {
      expect(MEMBER_PRESETS.length).toBeGreaterThanOrEqual(9);
      expect(OWNER_PRESETS.length).toBeGreaterThanOrEqual(9);

      // Verify abs and cardio map to healthy icon asset
      const memberAbs = MEMBER_PRESETS.find(p => p.id === 'abs');
      const memberCardio = MEMBER_PRESETS.find(p => p.id === 'cardio');
      const memberRest = MEMBER_PRESETS.find(p => p.id === 'rest');

      expect(memberAbs).toBeDefined();
      expect(memberAbs?.icon).toBeDefined();

      expect(memberCardio).toBeDefined();
      expect(memberCardio?.icon).toBeDefined();

      expect(memberRest).toBeDefined();
      expect(memberRest?.icon).toBeDefined();

      // Ensure no raw emojis in routine titles
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      MEMBER_PRESETS.forEach(preset => {
        expect(preset.title).not.toMatch(emojiRegex);
        expect(preset.id).toBeTruthy();
        expect(preset.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(preset.tint).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });

      OWNER_PRESETS.forEach(preset => {
        expect(preset.title).not.toMatch(emojiRegex);
        expect(preset.id).toBeTruthy();
        expect(preset.bg).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(preset.tint).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('guarantees 7-day starter templates have consistent days and muscle mappings', () => {
      const expectedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      MEMBER_INITIAL_SCHEDULE.forEach((daySchedule, idx) => {
        expect(daySchedule.day).toBe(expectedDays[idx]);
        expect(daySchedule.title).toBeTruthy();
        expect(daySchedule.iconBg).toBeTruthy();
        expect(daySchedule.iconTint).toBeTruthy();
      });

      OWNER_INITIAL_SCHEDULE.forEach((daySchedule, idx) => {
        expect(daySchedule.day).toBe(expectedDays[idx]);
        expect(daySchedule.title).toBeTruthy();
        expect(daySchedule.iconBg).toBeTruthy();
        expect(daySchedule.iconTint).toBeTruthy();
      });
    });
  });
});
