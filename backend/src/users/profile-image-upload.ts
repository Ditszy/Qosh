import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve, sep } from 'node:path';

export const UPLOADS_ROOT_DIR = resolve(process.cwd(), 'uploads');
export const PROFILE_IMAGE_UPLOADS_DIR = resolve(UPLOADS_ROOT_DIR, 'profile-images');
export const PROFILE_IMAGE_ROUTE_PREFIX = '/uploads/profile-images';
export const DEFAULT_PROFILE_IMAGE_URL = `${PROFILE_IMAGE_ROUTE_PREFIX}/default.jpg`;
export const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

export type ProfileImageUploadFile = {
    mimetype: string;
    buffer: Buffer;
};

export const profileImageUploadOptions = {
    limits: {
        fileSize: MAX_PROFILE_IMAGE_SIZE_BYTES,
    },
    fileFilter: (
        _request: unknown,
        file: { mimetype: string },
        callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
        if (!ALLOWED_MIME_EXTENSIONS[file.mimetype]) {
            callback(new BadRequestException('Unsupported image type'), false);
            return;
        }

        callback(null, true);
    },
};

export async function ensureProfileImageUploadDirectory(): Promise<void> {
    await mkdir(PROFILE_IMAGE_UPLOADS_DIR, { recursive: true });
}

export async function saveProfileImageFile(file: ProfileImageUploadFile): Promise<string> {
    const extension = ALLOWED_MIME_EXTENSIONS[file.mimetype];
    if (!extension) {
        throw new BadRequestException('Unsupported image type');
    }

    await ensureProfileImageUploadDirectory();

    const filename = `${randomUUID()}${extension}`;
    const filePath = resolve(PROFILE_IMAGE_UPLOADS_DIR, filename);
    await writeFile(filePath, file.buffer, { flag: 'wx' });

    return `${PROFILE_IMAGE_ROUTE_PREFIX}/${filename}`;
}

export async function deleteProfileImageFile(profileImageUrl: string | null | undefined): Promise<void> {
    if (!profileImageUrl || profileImageUrl === DEFAULT_PROFILE_IMAGE_URL) {
        return;
    }

    if (!profileImageUrl.startsWith(`${PROFILE_IMAGE_ROUTE_PREFIX}/`)) {
        return;
    }

    const filename = basename(profileImageUrl);
    if (filename === 'default.jpg') {
        return;
    }

    const filePath = resolve(PROFILE_IMAGE_UPLOADS_DIR, filename);
    if (!filePath.startsWith(`${PROFILE_IMAGE_UPLOADS_DIR}${sep}`)) {
        return;
    }

    try {
        await unlink(filePath);
    } catch {
        // Missing old images should not block profile updates.
    }
}
