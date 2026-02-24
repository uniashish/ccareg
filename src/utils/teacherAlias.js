const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getEmailLocalPart = (email) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail.includes("@")) return "";
  return normalizedEmail.split("@")[0] || "";
};

const toUsersArray = (usersInput) => {
  if (!usersInput) return [];
  if (Array.isArray(usersInput)) return usersInput;
  return Object.values(usersInput);
};

export const formatTeacherDisplayName = (teacherName, alias) => {
  const trimmedTeacherName = String(teacherName || "").trim();
  const trimmedAlias = String(alias || "").trim();

  if (!trimmedTeacherName) return "";
  if (!trimmedAlias) return trimmedTeacherName;

  const teacherLower = normalizeText(trimmedTeacherName);
  const aliasLower = normalizeText(trimmedAlias);

  if (teacherLower === aliasLower) return trimmedTeacherName;
  if (trimmedTeacherName.includes(`(${trimmedAlias})`))
    return trimmedTeacherName;

  return `${trimmedTeacherName} (${trimmedAlias})`;
};

export const resolveTeacherAlias = (teacherName, usersInput) => {
  const teacherKey = normalizeText(teacherName);
  if (!teacherKey) return "";

  const users = toUsersArray(usersInput);

  const matchedTeacher = users.find((user) => {
    if (!user || user.role !== "teacher") return false;

    const displayName = normalizeText(user.displayName || user.name);
    const email = normalizeText(user.email);
    const emailLocalPart = getEmailLocalPart(user.email);

    return [displayName, email, emailLocalPart].includes(teacherKey);
  });

  return String(matchedTeacher?.alias || "").trim();
};

export const enrichCCAsWithTeacherAlias = (ccas = [], usersInput) => {
  const users = toUsersArray(usersInput);

  return (ccas || []).map((cca) => {
    const teacherName = String(cca?.teacher || "").trim();
    const resolvedAlias = resolveTeacherAlias(teacherName, users);
    const teacherAlias = String(
      cca?.teacherAlias || resolvedAlias || "",
    ).trim();

    return {
      ...cca,
      teacherAlias,
      teacherDisplay: formatTeacherDisplayName(teacherName, teacherAlias),
    };
  });
};
