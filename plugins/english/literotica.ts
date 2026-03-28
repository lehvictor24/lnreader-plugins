import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { FilterTypes, Filters } from '@libs/filterInputs';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class LiteroticaPlugin implements Plugin.PluginBase {
  id = 'literotica';
  name = 'Literotica';
  icon = 'src/en/literotica/icon.png';
  site = 'https://www.literotica.com';
  version = '1.0.0';

  private readonly apiBase = 'https://literotica.com/api';
  private readonly apiKey = '70b3a71911b398a98d3dac695f34cf279c270ea0';
  private readonly appId = '24b7c3f9d904ebd679299b1ce5506bc305a5ab40';

  private apiUrl(endpoint: string, params: Record<string, string>): string {
    const qs = new URLSearchParams({
      ...params,
      apikey: this.apiKey,
      appid: this.appId,
    });
    return `${this.apiBase}/${endpoint}?${qs.toString()}`;
  }

  filters = {
    sort: {
      type: FilterTypes.Picker,
      label: 'Sort By',
      value: 'rate_all',
      options: [
        { label: 'Popular', value: 'rate_all' },
        { label: 'New', value: 'date_approve' },
      ],
    },
    tags: {
      type: FilterTypes.CheckboxGroup,
      label: 'Tags',
      value: [] as string[],
      options: [
        { label: 'Oral', value: '96' },
        { label: 'Lesbian', value: '347' },
        { label: 'Romance', value: '184' },
        { label: 'Threesome', value: '132' },
        { label: 'BDSM', value: '121' },
        { label: 'Incest', value: '25' },
        { label: 'Masturbation', value: '211' },
        { label: 'Group Sex', value: '291' },
        { label: 'Humiliation', value: '558' },
        { label: 'Femdom', value: '44' },
        { label: 'Bondage', value: '263' },
        { label: 'Cheating', value: '59' },
        { label: 'First Time', value: '43' },
        { label: 'Wife', value: '117' },
        { label: 'Fantasy', value: '114' },
        { label: 'Spanking', value: '413' },
        { label: 'Exhibitionism', value: '632' },
        { label: 'Interracial', value: '80' },
        { label: 'Voyeur', value: '107' },
        { label: 'Cunnilingus', value: '1261' },
        { label: 'Submission', value: '41' },
        { label: 'Creampie', value: '46' },
        { label: 'Mature', value: '10' },
        { label: 'MILF', value: '2888' },
        { label: 'Love', value: '185' },
        { label: 'Cum', value: '349' },
        { label: 'Mother', value: '27' },
        { label: 'Domination', value: '240' },
        { label: 'College', value: '134' },
        { label: 'Public', value: '176' },
        { label: 'Sister', value: '75' },
        { label: 'Big Tits', value: '31' },
        { label: 'Submissive', value: '188' },
        { label: 'Son', value: '29' },
        { label: 'Taboo', value: '904' },
        { label: 'Big Cock', value: '1573' },
        { label: 'Older Woman', value: '726' },
        { label: 'Romantic', value: '586' },
        { label: 'Drama', value: '3706' },
        { label: 'Fetish', value: '633' },
        { label: 'Magic', value: '486' },
        { label: 'Bisexual', value: '968' },
        { label: 'Daughter', value: '26' },
        { label: 'Virgin', value: '186' },
        { label: 'Orgasm', value: '924' },
        { label: 'Brother', value: '76' },
        { label: 'Reluctance', value: '985' },
        { label: 'Seduction', value: '582' },
        { label: 'Fingering', value: '3893' },
        { label: 'Slut', value: '242' },
        { label: 'Panties', value: '81' },
        { label: 'Teasing', value: '18' },
        { label: 'Orgy', value: '746' },
        { label: 'Younger Woman', value: '3754' },
        { label: 'Chastity', value: '563' },
        { label: 'Teacher', value: '84' },
        { label: 'Blonde', value: '2228' },
        { label: 'Lingerie', value: '209' },
        { label: 'Teen', value: '135' },
        { label: 'Shower', value: '92' },
        { label: '18-Year-Old', value: '246211' },
        { label: 'Hotwife', value: '6400' },
        { label: 'Sci-Fi', value: '113' },
        { label: 'FFM', value: '246' },
        { label: 'Revenge', value: '94' },
      ],
    },
  } satisfies Filters;

  async popularNovels(
    pageNo: number,
    {
      showLatestNovels,
      filters,
    }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const tagIds = (filters?.tags?.value ?? []).map(v => parseInt(v));
    const sortByNew =
      showLatestNovels || filters?.sort?.value === 'date_approve';

    let url: string;

    if (tagIds.length > 0) {
      const params = JSON.stringify({
        tags: tagIds,
        sort_by: filters.sort.value,
        page: pageNo,
      });
      url = this.apiUrl('3/tagsportal/stories', { params });
    } else if (sortByNew) {
      const filter = JSON.stringify([
        { property: 'type', value: 'story' },
        { property: 'newonly', value: 'yes' },
      ]);
      url = this.apiUrl('1/submissions', { filter, page: String(pageNo) });
    } else {
      const filter = JSON.stringify([{ property: 'type', value: 'story' }]);
      url = this.apiUrl('1/top', { filter, page: String(pageNo) });
    }

    const resp = await fetchApi(url);
    const data = await resp.json();

    const submissions: any[] = data.submissions ?? [];
    if (!submissions.length) return [];

    return submissions.map(item => ({
      name: item.title ?? item.name,
      path: String(item.id),
      cover: defaultCover,
    }));
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const filter = JSON.stringify([
      { property: 'submission_id', value: parseInt(novelPath) },
    ]);
    const url = this.apiUrl('2/submissions/pages', { filter });

    const resp = await fetchApi(url);
    const data = await resp.json();

    if (!data.success || !data.pages?.length) {
      return { path: novelPath, name: '', chapters: [] };
    }

    const firstPage = data.pages[0];
    const genres = ((firstPage.tags ?? []) as any[])
      .sort((a, b) => b.submission_count - a.submission_count)
      .slice(0, 5)
      .map(t => t.name)
      .join(', ');

    let author = '';
    let summary = '';
    let rating: number | undefined;

    try {
      const metaFilter = JSON.stringify([
        { property: 'related_id', value: parseInt(novelPath) },
      ]);
      const metaUrl = this.apiUrl('1/submissions', { filter: metaFilter });
      const metaResp = await fetchApi(metaUrl);
      const metaData = await metaResp.json();
      if (metaData.submissions?.length) {
        const match =
          metaData.submissions.find((s: any) => String(s.id) === novelPath) ??
          metaData.submissions[0];
        author = match.user?.username ?? '';
        summary = match.description ?? '';
        rating = match.rate;
      }
    } catch {}

    const totalPages: number = data.total ?? 1;
    const chapters: Plugin.ChapterItem[] = Array.from(
      { length: totalPages },
      (_, i) => ({
        name: totalPages === 1 ? firstPage.name : `Page ${i + 1}`,
        path: `${novelPath}/${i}`,
        chapterNumber: i + 1,
      }),
    );

    return {
      path: novelPath,
      name: firstPage.name,
      cover: defaultCover,
      author,
      summary,
      genres,
      status: NovelStatus.Completed,
      rating,
      chapters,
    };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const slashIdx = chapterPath.lastIndexOf('/');
    const storyId = chapterPath.slice(0, slashIdx);
    const pageIdx = parseInt(chapterPath.slice(slashIdx + 1));

    const filter = JSON.stringify([
      { property: 'submission_id', value: parseInt(storyId) },
    ]);
    const url = this.apiUrl('2/submissions/pages', { filter });

    const resp = await fetchApi(url);
    const data = await resp.json();

    return data.pages?.[pageIdx]?.content ?? '';
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const params = JSON.stringify({ q: searchTerm, page: pageNo });
    const url = this.apiUrl('3/search/stories', { params });

    const resp = await fetchApi(url);
    const data = await resp.json();

    if (!data.data?.length) return [];

    return data.data.map((item: any) => ({
      name: item.title,
      path: String(item.id),
      cover: defaultCover,
    }));
  }
}

export default new LiteroticaPlugin();
