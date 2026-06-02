import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Helper to remove "[ĐỌC SÁCH THAY BẠN]" prefix
function cleanVideoTitle(title: string) {
  const prefix = "[ĐỌC SÁCH THAY BẠN]";
  let clean = title;
  if (clean.toUpperCase().startsWith(prefix)) {
      clean = clean.substring(prefix.length).trim();
      clean = clean.replace(/^[:-]/, '').trim();
  }
  return clean;
}

// Helper to generate SEO friendly slug
function generateSlug(text: string) {
  return text.toString().toLowerCase()
    .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
    .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
    .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
    .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
    .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
    .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
    .replace(/đ/gi, 'd')
    .replace(/\s+/g, '-') 
    .replace(/[^\w\-]+/g, '') 
    .replace(/\-\-+/g, '-') 
    .replace(/^-+/, '') 
    .replace(/-+$/, '');
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Simple in-memory cache to avoid hitting YouTube API limits
  let videoCache: any = null;
  let lastFetchTime = 0;
  const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  async function getVideos() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;

    if (!apiKey || !channelId || apiKey === 'YOUR_YOUTUBE_API_KEY') {
      throw new Error('YouTube API is not configured.');
    }

    if (videoCache && (Date.now() - lastFetchTime < CACHE_DURATION)) {
      return videoCache;
    }

    // 1. Fetch channel's playlists
    const playlistsResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50&key=${apiKey}`);
    const playlistsData = await playlistsResponse.json();

    if (!playlistsData.items || playlistsData.items.length === 0) {
        throw new Error('No playlists found for this channel.');
    }

    // Explicitly target the user's requested playlists
    const targetPlaylistNames = ['đọc sách thay bạn', 'vĩ nhân lịch sử', 'lịch sử việt nam', 'lịch sử trung quốc'];
    const matchedPlaylists = playlistsData.items.filter((item: any) => {
      const title = item.snippet.title.toLowerCase();
      return targetPlaylistNames.some(name => title.includes(name));
    });

    if (matchedPlaylists.length === 0) {
      throw new Error('Could not find the specified target playlists on this channel.');
    }

    let allVideos: any[] = [];

    // 2. Fetch all videos from matched playlists
    for (const playlist of matchedPlaylists) {
      let nextPageToken = '';
      let fetchedCount = 0;
      
      do {
        const pageTokenParam = nextPageToken ? `&pageToken=${nextPageToken}` : '';
        const itemsResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,status&playlistId=${playlist.id}&maxResults=50${pageTokenParam}&key=${apiKey}`);
        const itemsData = await itemsResponse.json();
        
        if (itemsData.items) {
          const now = Date.now();
          for (const item of itemsData.items) {
             // Bỏ qua các video không công khai (Private, Unlisted)
             if (item.status?.privacyStatus !== 'public') continue;
             
             // Bỏ qua video có title mặc định khi video bị ẩn/xoá bởi Youtube
             if (item.snippet.title === 'Private video' || item.snippet.title === 'Deleted video') continue;

             // Bỏ qua các video đang lên lịch (có ngày xuất bản trong tương lai)
             const videoPublishedAt = item.snippet.videoPublishedAt;
             if (videoPublishedAt && new Date(videoPublishedAt).getTime() > now) continue;

             const cleanTitle = cleanVideoTitle(item.snippet.title);
             allVideos.push({
               id: item.snippet.resourceId.videoId,
               title: cleanTitle,
               slug: generateSlug(cleanTitle),
               description: item.snippet.description,
               thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
               publishedAt: videoPublishedAt || item.snippet.publishedAt,
               playlistTitle: playlist.snippet.title // Attach playlist title for categorization
             });
          }
        }
        nextPageToken = itemsData.nextPageToken;
        fetchedCount += (itemsData.items?.length || 0);
        
        // Break at 200 items per playlist to ensure we don't hit quotas unexpectedly
        if (fetchedCount >= 200) break;
      } while (nextPageToken);
    }

    // Deduplicate videos based on video ID in case a video is in multiple target playlists
    const uniqueVideosMap = new Map();
    allVideos.forEach(v => {
       if (!uniqueVideosMap.has(v.id)) {
          uniqueVideosMap.set(v.id, v);
       }
    });
    const deduplicatedVideos = Array.from(uniqueVideosMap.values());

    // Fetch statistics for these videos in chunks of 50
    const videoIds = deduplicatedVideos.map(v => v.id);
    for (let i = 0; i < videoIds.length; i += 50) {
       const chunk = videoIds.slice(i, i + 50);
       const statsResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${chunk.join(',')}&key=${apiKey}`);
       const statsData = await statsResponse.json();
       if (statsData.items) {
         for (const item of statsData.items) {
           const video = uniqueVideosMap.get(item.id);
           if (video) {
             video.viewCount = item.statistics?.viewCount || '0';
             video.likeCount = item.statistics?.likeCount || '0';
             video.commentCount = item.statistics?.commentCount || '0';
           }
         }
       }
    }

    const videos = Array.from(uniqueVideosMap.values());

    // Sort by publishedAt descending
    videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    videoCache = videos;
    lastFetchTime = Date.now();

    return videos;
  }

  app.get('/api/videos', async (req, res) => {
    try {
      const videos = await getVideos();
      res.json({ videos });
    } catch (error: any) {
      if (error.message === 'YouTube API is not configured.') {
        return res.status(503).json({ 
          error: error.message,
          details: 'Please set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID in your environment variables.'
        });
      }
      if (error.message.includes('No playlists found') || error.message.includes('Could not find')) {
        return res.status(404).json({ error: error.message });
      }
      console.error('Error fetching YouTube videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos from YouTube.' });
    }
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl = `https://${req.get('host')}`;
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  app.get('/sitemap.xml', async (req, res) => {
    try {
      const videos = await getVideos();
      const baseUrl = `https://${req.get('host')}`;
      
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Add home page
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/</loc>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>1.0</priority>\n';
      xml += '  </url>\n';

      // Add video pages
      for (const video of videos) {
        const videoUrl = `${baseUrl}/video/${video.slug ? video.slug + '-' : ''}${video.id}`;
        xml += '  <url>\n';
        xml += `    <loc>${videoUrl}</loc>\n`;
        // Use publishedAt date for lastmod if available
        if (video.publishedAt) {
           xml += `    <lastmod>${new Date(video.publishedAt).toISOString()}</lastmod>\n`;
        }
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      }

      xml += '</urlset>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Vite middleware for development
  let vite: any;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distClientPath = path.join(process.cwd(), 'dist/client');
    app.use(express.static(distClientPath, { 
      index: false,
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
  }

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;

    try {
      let template: string;
      let render: any;

      if (process.env.NODE_ENV !== 'production') {
        const fs = await import('fs');
        template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render;
      } else {
        const fs = await import('fs');
        template = fs.readFileSync(path.resolve('dist/client/index.html'), 'utf-8');
        const serverModule = await import(path.resolve('dist/server/entry-server.js') + ''); // + '' to avoid build time resolution if any
        render = serverModule.render;
      }

      const context: { helmetContext: any } = { helmetContext: {} };
      const appHtml = render(url, context);
      const { helmet } = context.helmetContext;

      let html = template.replace(`<!--app-html-->`, appHtml);
      
      // Inject dynamic video SEO tags if it's a video page
      let injectedHelmetTags = '';
      if (helmet) {
         injectedHelmetTags = `
           ${helmet.title.toString()}
           ${helmet.priority.toString()}
           ${helmet.meta.toString()}
           ${helmet.link.toString()}
           ${helmet.script.toString()}
         `;
      }

      if (url.startsWith('/video/')) {
        try {
          const seoInfo = url.split('/video/')[1].split('?')[0];
          const id = seoInfo ? seoInfo.substring(seoInfo.length - 11) : '';
          const videos = await getVideos();
          const video = videos.find((v: any) => v.id === id);
          if (video) {
             const origin = `https://${req.get('host')}`;
             const videoUrl = `${origin}/video/${video.slug ? video.slug + '-' : ''}${video.id}`;
             const ldJson = {
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "VideoObject",
                    "name": video.title,
                    "description": video.description || video.title,
                    "thumbnailUrl": [video.thumbnail],
                    "uploadDate": video.publishedAt,
                    "contentUrl": `https://www.youtube.com/watch?v=${video.id}`,
                    "embedUrl": `https://www.youtube.com/embed/${video.id}`
                  },
                  {
                    "@type": "BreadcrumbList",
                    "itemListElement": [{
                      "@type": "ListItem",
                      "position": 1,
                      "name": "Trang chủ",
                      "item": origin
                    },{
                      "@type": "ListItem",
                      "position": 2,
                      "name": video.title,
                      "item": videoUrl
                    }]
                  }
                ]
             };
             injectedHelmetTags = `
               <title data-rh="true">${video.title} | Đọc Sách Đa Chiều</title>
               <meta data-rh="true" name="description" content="${(video.description || '').substring(0, 160).replace(/"/g, '&quot;')}" />
               <meta data-rh="true" property="og:title" content="${video.title} | Đọc Sách Đa Chiều" />
               <meta data-rh="true" property="og:description" content="${(video.description || '').substring(0, 160).replace(/"/g, '&quot;')}" />
               <meta data-rh="true" property="og:image" content="${video.thumbnail}" />
               <meta data-rh="true" property="og:image:width" content="1280" />
               <meta data-rh="true" property="og:image:height" content="720" />
               <meta data-rh="true" property="og:type" content="video.other" />
               <meta data-rh="true" property="og:url" content="${videoUrl}" />
               <meta data-rh="true" name="twitter:card" content="summary_large_image" />
               <meta data-rh="true" name="twitter:title" content="${video.title} | Đọc Sách Đa Chiều" />
               <meta data-rh="true" name="twitter:description" content="${(video.description || '').substring(0, 160).replace(/"/g, '&quot;')}" />
               <meta data-rh="true" name="twitter:image" content="${video.thumbnail}" />
               <link data-rh="true" rel="canonical" href="${videoUrl}" />
               <script data-rh="true" type="application/ld+json">${JSON.stringify(ldJson)}</script>
             `;
          }
        } catch (err) {
          console.error("Error prefetching video for SSR SEO", err);
        }
      }

      html = html.replace('</head>', `${injectedHelmetTags}\n</head>`);

      res.status(200).set({ 
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300' 
      }).end(html);
    } catch (e: any) {
      if (vite) {
        vite.ssrFixStacktrace(e);
      }
      next(e);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
