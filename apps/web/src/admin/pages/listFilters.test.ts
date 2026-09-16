import { describe, expect, it } from 'vitest';
import { DevelopmentIdentityRepository, developmentIdentityIds } from '../../identity/developmentIdentityRepository';
import { IdentityService } from '../../identity/identityService';
import { filterClasses, filterGuardians, filterStaff, filterStudents, filterUsers } from './listFilters';

function createService() {
  return new IdentityService(new DevelopmentIdentityRepository());
}

function contextFor(service: IdentityService, userId: string) {
  const result = service.createUserContext(userId);
  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.value;
}

describe('Admin list filters', () => {
  it('filters students by search, year, class and status within scoped service results', () => {
    const service = createService();
    const teacherContext = contextFor(service, developmentIdentityIds.teacher3A);
    const visibleStudents = service.getVisibleStudents(teacherContext);

    expect(visibleStudents.map((summary) => summary.student.id).sort()).toEqual([
      developmentIdentityIds.studentChloe,
      developmentIdentityIds.studentMaya,
    ].sort());
    expect(filterStudents(visibleStudents, {
      classId: developmentIdentityIds.class3A,
      query: 'chloe',
      status: 'active',
      yearGroupId: 'year_3',
    }).map((summary) => summary.student.id)).toEqual([developmentIdentityIds.studentChloe]);
  });

  it('filters parent lists by linked multi-child relationships', () => {
    const service = createService();
    const principalContext = contextFor(service, developmentIdentityIds.principal);

    const filtered = filterGuardians(service.getVisibleGuardians(principalContext), 'ethan');

    expect(filtered.map((guardian) => guardian.user.id)).toEqual([developmentIdentityIds.parentAmy]);
  });

  it('filters staff, class and user lists by visible text', () => {
    const service = createService();
    const principalContext = contextFor(service, developmentIdentityIds.principal);

    expect(filterStaff(service.getVisibleStaff(principalContext), 'primary').map((summary) => summary.user.id).sort()).toEqual([
      developmentIdentityIds.teacher3A,
      developmentIdentityIds.teacher3B,
    ].sort());
    expect(filterClasses(service.getVisibleClasses(principalContext), 'jordan').map((summary) => summary.class.id)).toEqual([
      developmentIdentityIds.class3B,
    ]);
    expect(filterUsers(service.getVisibleUsers(principalContext), 'admin').map((user) => user.id)).toContain(developmentIdentityIds.admin);
  });
});
