import { CommentVo, ReplyVo } from '@halo-dev/api-client';
import { getAvatarProvider } from './avatar-provider';

abstract class AvatarPolicy {
  abstract applyCommentPolicy(comment: CommentVo | undefined): string | undefined;
  abstract applyReplyPolicy(reply: ReplyVo | undefined): string | undefined;
}

let policyInstance: AvatarPolicy | undefined;
const emailKind = "Email";
const emailHash = "emailHash";

class AnonymousUserPolicy extends AvatarPolicy {
  applyCommentPolicy(comment: CommentVo | undefined): string | undefined {
    const avatarProvider = getAvatarProvider();
    const isAnonymous = comment?.owner.kind === emailKind;
    if (isAnonymous) {
      return avatarProvider?.getAvatarSrc(comment?.spec.owner.annotations?.[emailHash]);
    }
    return comment?.owner.avatar;
  }
  applyReplyPolicy(reply: ReplyVo | undefined): string | undefined {
    const avatarProvider = getAvatarProvider();
    const isAnonymous = reply?.owner.kind === emailKind;
    if (isAnonymous) {
      return avatarProvider?.getAvatarSrc(reply?.spec.owner.annotations?.[emailHash]);
    }
    return reply?.owner.avatar;
  }
}

class AllUserPolicy extends AvatarPolicy {
  applyCommentPolicy(comment: CommentVo | undefined): string | undefined {
    const avatarProvider = getAvatarProvider();
    return avatarProvider?.getAvatarSrc(comment?.spec.owner.annotations?.[emailHash]);
  }
  applyReplyPolicy(reply: ReplyVo | undefined): string | undefined {
    const avatarProvider = getAvatarProvider();
    return avatarProvider?.getAvatarSrc(reply?.spec.owner.annotations?.[emailHash]);
  }
}

class NoAvatarUserPolicy extends AvatarPolicy {
  applyCommentPolicy(comment: CommentVo | undefined): string | undefined {
    const avatarProvider = getAvatarProvider();
    const isAnonymous = comment?.owner.kind === emailKind;
    if (isAnonymous) {
      return undefined;
    }
    const avatar = comment?.owner.avatar;
    if (!avatar) {
      return avatarProvider?.getAvatarSrc(comment?.spec.owner.annotations?.[emailHash]);
    }
    return avatar;
  }
  applyReplyPolicy(reply: ReplyVo | undefined): string | undefined {
    const avatarProvider = getAvatarProvider();
    const isAnonymous = reply?.owner.kind === emailKind;
    if (isAnonymous) {
      return undefined;
    }
    const avatar = reply?.owner.avatar;
    if (!avatar) {
      return avatarProvider?.getAvatarSrc(reply?.spec.owner.annotations?.[emailHash]);
    }
    return avatar;
  }
}

enum AvatarPolicyEnum {
  ANONYMOUS_USER_POLICY = "AnonymousUserPolicy",
  ALL_USER_POLICY = "AllUserPolicy",
  NO_AVATAR_USER_POLICY = "NoAvatarUserPolicy"
}

function setPolicyInstance(nPolicyInstance: AvatarPolicy | undefined) {
  policyInstance = nPolicyInstance;
}

function getPolicyInstance(): AvatarPolicy | undefined {
  return policyInstance;
}

export { AnonymousUserPolicy, AllUserPolicy, NoAvatarUserPolicy, AvatarPolicyEnum, setPolicyInstance, getPolicyInstance };