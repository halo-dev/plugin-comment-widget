import { CommentVo, ReplyVo } from '@halo-dev/api-client';

abstract class AvatarPolicy {
    abstract applyCommentPolicy(comment: CommentVo | undefined): string | undefined;
    abstract applyReplyPolicy(reply: ReplyVo | undefined): string | undefined;
}

// TODO fetch from halo
let currentPolicy = "AnonymousUserPolicy";
let currentPolicyObj: AvatarPolicy | undefined;
const emailKind = "Email"
const emailHash = "emailHash";
const avatarProvider = "https://gravatar.com/avatar/";

class AnonymousUserPolicy extends AvatarPolicy {
    applyCommentPolicy(comment: CommentVo | undefined): string | undefined {
        const isAnonymous = comment?.owner.kind === emailKind;
        if (isAnonymous) {
            return avatarProvider + comment?.spec.owner.annotations?.[emailHash];
        }
        return comment?.owner.avatar;
    }
    applyReplyPolicy(reply: ReplyVo | undefined): string | undefined {
        const isAnonymous = reply?.owner.kind === emailKind;
        if (isAnonymous) {
            return avatarProvider + reply?.spec.owner.annotations?.[emailHash];
        }
        return reply?.owner.avatar;
    }
}

class AllUserPolicy extends AvatarPolicy {
    applyCommentPolicy(comment: CommentVo | undefined): string | undefined {
        return avatarProvider + comment?.spec.owner.annotations?.[emailHash];
    }
    applyReplyPolicy(reply: ReplyVo | undefined): string | undefined {
        return avatarProvider + reply?.spec.owner.annotations?.[emailHash];
    }
}

class NoAvatarUserPolicy extends AvatarPolicy {
    applyCommentPolicy(comment: CommentVo | undefined): string | undefined {
        const avatar = comment?.owner.avatar;
        if (!avatar) {
            return avatarProvider + comment?.spec.owner.annotations?.[emailHash];
        }
        return avatar;
    }
    applyReplyPolicy(reply: ReplyVo | undefined): string | undefined {
        const avatar = reply?.owner.avatar;
        if (!avatar) {
            return avatarProvider + reply?.spec.owner.annotations?.[emailHash];
        }
        return avatar;
    }
}

enum AvatarPolicyEnum {
    "AnonymousUserPolicy" = "AnonymousUserPolicy",
    "AllUserPolicy" = "AllUserPolicy",
    "NoAvatarUserPolicy" = "NoAvatarUserPolicy"
}

function getPolicyInstance(): AvatarPolicy {
    if (currentPolicyObj != undefined) {
        return currentPolicyObj;
    }
    switch (currentPolicy) {
        case AvatarPolicyEnum.AllUserPolicy: {
            currentPolicyObj = new AllUserPolicy();
            break;
        }
        case AvatarPolicyEnum.NoAvatarUserPolicy: {
            currentPolicyObj = new NoAvatarUserPolicy();
            break;
        }
        case AvatarPolicyEnum.AnonymousUserPolicy:
        default:
            currentPolicyObj = new AnonymousUserPolicy();
    }
    return currentPolicyObj;
}

export {AnonymousUserPolicy, AllUserPolicy, NoAvatarUserPolicy, getPolicyInstance}