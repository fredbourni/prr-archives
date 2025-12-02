
const MIXCLOUD_IMAGE_BASE_URL = 'https://thumbnailer.mixcloud.com/unsafe';

export const ImageSize = {
    THUMBNAIL: '100x100',
    SMALL: '320x320',
    MEDIUM: '320x320', // Mapping medium to 320x320 for now, or could be larger
    LARGE: '600x600',
    EXTRA_LARGE: '1024x1024',
} as const;

export type ImageSizeKey = keyof typeof ImageSize;

/**
 * Constructs the Mixcloud image URL from a picture key and size.
 * @param key The picture key (e.g., 'extaudio/.../uuid').
 * @param size The desired image size (e.g., '100x100', '600x600'). Defaults to LARGE.
 * @returns The full image URL.
 */
export const getShowImage = (key: string, size: string = ImageSize.MEDIUM): string => {
    if (!key) return '';
    return `${MIXCLOUD_IMAGE_BASE_URL}/${size}/${key}`;
};
